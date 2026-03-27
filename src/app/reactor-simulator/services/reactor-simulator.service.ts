// ============================================================
//  reactor-simulator.service.ts  v2
//  All physics use analytical (exact) ODE solutions — stable
//  at any timestep size.
//
//  v2 additions:
//  • Emergency scenarios: LOCA, Station Blackout, Rod Ejection
//  • SCRAM no longer mutates the UI slider value (done in component)
//  • Emergency physics: forced pump caps, passive convection, ECCS
// ============================================================
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ReactorState, ReactorStatus, LogType, EmergencyMode } from '../models/reactor.models';

const INITIAL_STATE = (): ReactorState => ({
  rodInsertion: 100,
  pumpSpeed: 60,
  turbineOn: true,
  neutronFlux: 0,
  coreTemp: 285,
  xenonLevel: 0,
  powerOutput: 0,
  steamPressure: 0,
  coolantOutTemp: 285,
  meltdownRisk: 0,
  thermalPower: 0,
  reactorStatus: 'SHUTDOWN',
  isScrammed: false,
  simTime: 0,
  emergencyMode: null,
  eccsActive: false,
  dieselGenActive: false,
  pressureReliefOpen: false,
  events: [],
});

@Injectable({ providedIn: 'root' })
export class ReactorSimulatorService implements OnDestroy {
  readonly MAX_POWER_MWe  = 300;
  readonly SCRAM_TEMP     = 430;
  readonly INLET_TEMP     = 280;
  readonly SIM_SPEED      = 30;

  private readonly PHYSICS_MS = 50;   // 20 Hz physics
  private readonly PUBLISH_MS = 100;  // 10 Hz UI

  private _state: ReactorState = INITIAL_STATE();
  private _subject = new BehaviorSubject<ReactorState>(this._state);

  private _running     = false;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _lastT: number | null = null;
  private _eventId    = 0;
  private _publishAccum = 0;

  private _xenonWarnLogged = false;
  private _tempWarnLogged  = false;

  // Tracks the pump value the USER wants; emergency may override actual pumpSpeed
  private _userPumpSpeed = 60;

  readonly state$: Observable<ReactorState> = this._subject.asObservable();
  get snapshot(): ReactorState { return this._state; }

  constructor(private ngZone: NgZone) {}

  // ══ Lifecycle ════════════════════════════════════════════

  start(): void {
    if (this._running) return;
    this._running      = true;
    this._lastT        = performance.now();
    this._publishAccum = 0;
    this.ngZone.runOutsideAngular(() => {
      this._intervalId = setInterval(() => this._tick(), this.PHYSICS_MS);
    });
  }

  pause(): void {
    this._running = false;
    if (this._intervalId !== null) { clearInterval(this._intervalId); this._intervalId = null; }
  }

  reset(): void {
    this.pause();
    this._state           = INITIAL_STATE();
    this._eventId         = 0;
    this._publishAccum    = 0;
    this._userPumpSpeed   = 60;
    this._xenonWarnLogged = false;
    this._tempWarnLogged  = false;
    this._log('SYS', 'Simulator reset to initial state.');
    this._publish();
    this.start();
  }

  ngOnDestroy(): void { this.pause(); }

  // ══ Normal controls ══════════════════════════════════════

  setRodInsertion(v: number): void {
    this._state.rodInsertion = Math.max(0, Math.min(100, v));
    this._state.isScrammed   = false;
  }

  setPumpSpeed(v: number): void {
    this._userPumpSpeed = Math.max(0, Math.min(100, v));
    // Actual pumpSpeed will be resolved in the physics tick respecting emergencies
  }

  setTurbineOn(v: boolean): void { this._state.turbineOn = v; }

  /**
   * SCRAM: physically inserts all rods.
   * Does NOT update rodValue on the component — the slider stays where
   * the operator left it (realistic: SCRAM is a separate trip circuit).
   */
  scram(): void {
    this._state.rodInsertion = 100;
    this._state.isScrammed   = true;
    this._log('SCRAM', '⚠ Emergency SCRAM — all control rods fully inserted');
  }

  startup(): void {
    this._state.isScrammed   = false;
    this._state.rodInsertion = 0;
    this._state.pumpSpeed    = Math.max(60, this._state.pumpSpeed);
    this._userPumpSpeed      = this._state.pumpSpeed;
    this._log('SYS', 'Startup sequence initiated — rods withdrawing');
  }

  // ══ Emergency triggers ═══════════════════════════════════

  /**
   * LOCA — Loss of Coolant Accident
   * A primary coolant pipe ruptures. Pump pressure collapses to zero.
   * ECCS (borated water injection) is the safety response.
   */
  triggerLOCA(): void {
    if (this._state.emergencyMode) return;
    this._state.emergencyMode = 'LOCA';
    this._state.eccsActive    = false;
    this._log('EMERGENCY', '🚨 LOCA: Primary coolant pipe rupture detected!');
    this._log('ALERT',     'Coolant pressure dropping — pump losing suction');
    this._publish();
  }

  /**
   * Activate ECCS — Emergency Core Cooling System
   * High-pressure borated water is injected into the core.
   * Boron absorbs neutrons (increases xenon effect), cold water cools the core.
   */
  activateECCS(): void {
    if (this._state.emergencyMode !== 'LOCA') return;
    this._state.eccsActive = true;
    this._log('SYS', '✅ ECCS activated — borated water injection at 40 % flow');
    this._log('INFO', 'Boron absorbing neutrons — reactivity suppressed');
    this._publish();
  }

  /**
   * Station Blackout — all AC power lost (like Fukushima scenario).
   * Electric coolant pumps fail immediately.
   * Only passive natural convection remains (≈10 % cooling).
   * Diesel generators restore partial power.
   */
  triggerBlackout(): void {
    if (this._state.emergencyMode) return;
    this._state.emergencyMode    = 'BLACKOUT';
    this._state.dieselGenActive  = false;
    this._state.turbineOn        = false;
    this._log('EMERGENCY', '⚡ STATION BLACKOUT — all AC power lost!');
    this._log('ALERT',     'Electric coolant pumps failing — natural convection only');
    this._publish();
  }

  /**
   * Start diesel generator backup power.
   * Restores partial cooling (35 % pump capacity).
   */
  startDieselGenerators(): void {
    if (this._state.emergencyMode !== 'BLACKOUT') return;
    this._state.dieselGenActive = true;
    this._log('SYS', '✅ Diesel generators online — emergency cooling restored');
    this._log('INFO', 'Pump capacity: 35 % (diesel limit). Turbine still offline.');
    this._publish();
  }

  /**
   * Rod Ejection Accident — a control rod drive mechanism fails,
   * mechanically ejecting a rod and causing a sudden reactivity surge.
   */
  triggerRodEjection(): void {
    if (this._state.emergencyMode) return;
    this._state.emergencyMode = 'ROD_EJECTION';
    // Rods go to 0 regardless of where the slider is
    this._state.rodInsertion  = 0;
    this._log('EMERGENCY', '☢ ROD EJECTION: Drive mechanism failure — rod fully withdrawn!');
    this._log('ALERT',     'Rapid power excursion in progress — auto-SCRAM armed');
    this._publish();
  }

  /** Clear an emergency after it has been stabilised */
  clearEmergency(): void {
    this._state.emergencyMode    = null;
    this._state.eccsActive       = false;
    this._state.dieselGenActive  = false;
    this._state.pressureReliefOpen = false;
    this._log('SYS', 'Emergency cleared — returning to normal operations');
    this._publish();
  }

  // ══ Physics tick ═════════════════════════════════════════

  private _tick(): void {
    if (!this._running) return;

    const now = performance.now();
    const rdT = Math.min((now - (this._lastT ?? now)) / 1000, 0.1);
    this._lastT = now;

    this._state.simTime += rdT * this.SIM_SPEED;
    this._updatePhysics(rdT * this.SIM_SPEED, rdT);

    this._publishAccum += rdT * 1000;
    if (this._publishAccum >= this.PUBLISH_MS) {
      this._publishAccum = 0;
      this._publish();
    }
  }

  private _updatePhysics(dt: number, rdT: number): void {
    const s = this._state;

    // ── Resolve effective pump speed (emergency may override) ────
    this._resolveEmergencyPump(s, rdT);

    // ── Auto-SCRAM on high temperature ──────────────────────────
    if (s.coreTemp > this.SCRAM_TEMP && !s.isScrammed) {
      this.scram();
      this._log('ALERT', `AUTO-SCRAM: Core ${Math.round(s.coreTemp)}°C > ${this.SCRAM_TEMP}°C`);
    }

    // ── Reactivity factors ──────────────────────────────────────
    const kRod   = 1 - s.rodInsertion / 100;
    // ECCS injects borated water → extra neutron absorption (adds ~0.3 effective xenon)
    const kXenon = 1 - (s.xenonLevel / 100) * 0.72 - (s.eccsActive ? 0.30 : 0);
    const kTemp  = 1 - Math.max(0, (s.coreTemp - 295) / 190) * 0.45;
    const kCool  = s.pumpSpeed < 5 ? 0.2 : 1;
    const reactivity = Math.max(0, kRod * Math.max(0, kXenon) * kTemp * kCool);

    // ── Neutron flux (analytical first-order lag) ────────────────
    const targetFlux = reactivity * 102;
    const tau        = 2.5;
    s.neutronFlux   += (targetFlux - s.neutronFlux) * (1 - Math.exp(-dt / tau));
    s.neutronFlux    = Math.max(0, Math.min(100, s.neutronFlux));

    const fluxN   = s.neutronFlux / 100;
    const flowEff = s.pumpSpeed / 100;

    // ── Core temperature (analytical, always stable) ─────────────
    {
      const A   = fluxN * 280;
      const B   = flowEff * 2.2;
      const T0p = s.coreTemp - this.INLET_TEMP;
      let newTp: number;
      if (B > 1e-4) {
        const Tss = A / B;
        newTp     = Tss + (T0p - Tss) * Math.exp(-B * dt);
      } else {
        newTp = T0p + A * dt;
      }
      s.coreTemp       = Math.max(this.INLET_TEMP, this.INLET_TEMP + newTp);
      s.coolantOutTemp = s.coreTemp;
    }

    // ── Xenon-135 (analytical, always stable) ───────────────────
    {
      const a  = fluxN * 2.8;
      const b  = (0.12 + fluxN * 1.8) / 100;
      let newXe: number;
      if (b > 1e-6) {
        const xss = a / b;
        newXe     = xss + (s.xenonLevel - xss) * Math.exp(-b * dt);
      } else {
        newXe = s.xenonLevel + a * dt - (s.xenonLevel / 100) * 0.12 * dt;
      }
      s.xenonLevel = Math.max(0, Math.min(100, newXe));
    }

    // ── Power & derived values ───────────────────────────────────
    s.powerOutput   = fluxN * this.MAX_POWER_MWe * (s.turbineOn ? 0.33 : 0);
    s.thermalPower  = fluxN * this.MAX_POWER_MWe / 0.33;
    s.steamPressure = Math.max(0, (s.coreTemp - 282) / 50) * 160;
    s.meltdownRisk  = Math.max(0, Math.min(100, (s.coreTemp - 360) / 70 * 100));

    // ── Automatic pressure relief valve ─────────────────────────
    if (s.steamPressure > 140 && !s.pressureReliefOpen) {
      s.pressureReliefOpen = true;
      this._log('SYS', '🔧 Pressure relief valve opened automatically');
    }
    if (s.steamPressure < 100 && s.pressureReliefOpen) {
      s.pressureReliefOpen = false;
      this._log('SYS', '🔧 Pressure relief valve closed');
    }

    // ── Status transition ────────────────────────────────────────
    const prev = s.reactorStatus;
    let next: ReactorStatus;
    if      (s.isScrammed)       next = 'SCRAM';
    else if (s.neutronFlux < 2)  next = 'SHUTDOWN';
    else if (s.neutronFlux < 20) next = 'SUBCRITICAL';
    else if (s.neutronFlux < 75) next = 'PARTIAL POWER';
    else                         next = 'FULL POWER';
    if (prev !== next) { s.reactorStatus = next; this._log('SYS', `Status → ${next}`); }

    // ── Standard warnings ────────────────────────────────────────
    if (s.xenonLevel > 55 && s.neutronFlux < 5 && !this._xenonWarnLogged) {
      this._log('WARNING', 'Xenon-135 DEAD ZONE — restart blocked. Wait for Xe-135 decay.');
      this._xenonWarnLogged = true;
    }
    if (s.xenonLevel < 20) this._xenonWarnLogged = false;
    if (s.coreTemp > 380 && !this._tempWarnLogged) {
      this._log('WARNING', `High temperature: ${Math.round(s.coreTemp)}°C — increase coolant flow`);
      this._tempWarnLogged = true;
    }
    if (s.coreTemp < 360) this._tempWarnLogged = false;
  }

  /**
   * Resolves what pump speed the physics should actually use,
   * accounting for emergency overrides.
   */
  private _resolveEmergencyPump(s: ReactorState, rdT: number): void {
    const em = s.emergencyMode;

    if (em === 'LOCA') {
      if (s.eccsActive) {
        // ECCS maintains at least 40 % emergency injection
        s.pumpSpeed = Math.max(40, this._userPumpSpeed);
      } else {
        // Coolant is leaking — pressure collapses over ~3 real seconds
        s.pumpSpeed = Math.max(0, s.pumpSpeed - rdT * 35);
      }
    } else if (em === 'BLACKOUT') {
      if (s.dieselGenActive) {
        // Diesel generators — partial power, min 35 %, max 65 %
        s.pumpSpeed = Math.max(35, Math.min(65, this._userPumpSpeed));
      } else {
        // Natural convection only — max ~10 %
        s.pumpSpeed = Math.min(s.pumpSpeed, 10);
        s.pumpSpeed = Math.max(s.pumpSpeed - rdT * 20, 8); // converge to ~8 %
        s.turbineOn = false;
      }
    } else if (em === 'ROD_EJECTION') {
      // Rods are physically ejected — insertion locked at 0 until SCRAM
      if (!s.isScrammed) {
        s.rodInsertion = 0;
      }
      // No pump restriction for rod ejection
      s.pumpSpeed = this._userPumpSpeed;
    } else {
      // Normal operation
      s.pumpSpeed = this._userPumpSpeed;
    }
  }

  // ══ Utilities ════════════════════════════════════════════

  _log(type: LogType, msg: string): void {
    this._state.events.unshift({ id: ++this._eventId, type, msg, time: this._fmtTime() });
    if (this._state.events.length > 30) this._state.events.pop();
  }

  _fmtTime(): string {
    const t = Math.floor(this._state.simTime);
    const h = Math.floor(t / 3600).toString().padStart(2, '0');
    const m = Math.floor((t % 3600) / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  private _publish(): void {
    this._subject.next({ ...this._state, events: [...this._state.events] });
  }
}
