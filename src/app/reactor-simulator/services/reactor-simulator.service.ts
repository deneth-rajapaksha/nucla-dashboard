// ============================================================
//  reactor-simulator.service.ts  (FIXED v2)
//  Pure physics engine — Injectable Angular service.
//
//  Performance architecture (unchanged from v1):
//  - Physics via setInterval at 20 Hz (50 ms)
//  - BehaviorSubject throttled to 10 Hz (Angular gauges)
//  - Renderer reads `snapshot` directly on every RAF frame
//
//  Stability fix (NEW in v2):
//  The original code and v1 both used forward-Euler integration
//  for coreTemp and xenonLevel:
//    x_new = x + (A - B·x) · dt
//  Forward-Euler is only stable when B·dt < 2.  With a 50 ms
//  real interval and SIM_SPEED = 30 the simulated dt is 1.5 s.
//    Temperature:  flowEff · 2.2 · 1.5 = 3.3 at 100 % pump → UNSTABLE
//    Xenon:        similar blow-up as flux/xenon coupling grows
//  Result: every state variable oscillates wildly during a drag.
//
//  Solution: replace the Euler step with the exact analytical
//  solution of the underlying first-order linear ODE
//    dx/dt = A - B·x  →  x(t) = A/B + (x₀ - A/B)·e^{-B·dt}
//  This is unconditionally stable for all dt > 0 and all B > 0.
//  Neutron flux already used this form; now temperature and xenon
//  use it too.
// ============================================================
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ReactorState, ReactorStatus, LogType } from '../models/reactor.models';

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
  events: [],
});

@Injectable({ providedIn: 'root' })
export class ReactorSimulatorService implements OnDestroy {
  // ── Constants ──────────────────────────────────────────
  readonly MAX_POWER_MWe = 300;
  readonly SCRAM_TEMP    = 430;
  readonly INLET_TEMP    = 280;
  readonly SIM_SPEED     = 30;

  /** Physics tick interval ms → 20 Hz */
  private readonly PHYSICS_MS = 50;
  /** BehaviorSubject emit interval ms → 10 Hz */
  private readonly PUBLISH_MS = 100;

  // ── State ──────────────────────────────────────────────
  private _state: ReactorState = INITIAL_STATE();
  private _subject = new BehaviorSubject<ReactorState>(this._state);

  // ── Loop state ────────────────────────────────────────
  private _running    = false;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _lastT: number | null = null;
  private _eventId   = 0;

  private _publishAccum = 0;

  // ── Warning debounce ──────────────────────────────────
  private _xenonWarnLogged = false;
  private _tempWarnLogged  = false;

  readonly state$: Observable<ReactorState> = this._subject.asObservable();

  get snapshot(): ReactorState { return this._state; }

  constructor(private ngZone: NgZone) {}

  // ══════════════════════════════════════════════════════
  //  Lifecycle
  // ══════════════════════════════════════════════════════

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
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  reset(): void {
    this.pause();
    this._state           = INITIAL_STATE();
    this._eventId         = 0;
    this._publishAccum    = 0;
    this._xenonWarnLogged = false;
    this._tempWarnLogged  = false;
    this._log('SYS', 'Simulator reset to initial state.');
    this._publish();
    this.start();
  }

  ngOnDestroy(): void { this.pause(); }

  // ══════════════════════════════════════════════════════
  //  Control commands
  // ══════════════════════════════════════════════════════

  setRodInsertion(v: number): void {
    this._state.rodInsertion = Math.max(0, Math.min(100, v));
    this._state.isScrammed   = false;
  }

  setPumpSpeed(v: number): void {
    this._state.pumpSpeed = Math.max(0, Math.min(100, v));
  }

  setTurbineOn(v: boolean): void { this._state.turbineOn = v; }

  scram(): void {
    this._state.rodInsertion = 100;
    this._state.isScrammed   = true;
    this._log('SCRAM', '⚠ Emergency SCRAM — all control rods fully inserted');
  }

  startup(): void {
    this._state.isScrammed   = false;
    this._state.rodInsertion = 0;
    this._state.pumpSpeed    = Math.max(60, this._state.pumpSpeed);
    this._log('SYS', 'Startup sequence initiated — rods withdrawing');
  }

  // ══════════════════════════════════════════════════════
  //  Physics tick
  // ══════════════════════════════════════════════════════

  private _tick(): void {
    if (!this._running) return;

    const now = performance.now();
    const rdT = Math.min((now - (this._lastT ?? now)) / 1000, 0.1);
    this._lastT = now;

    this._state.simTime += rdT * this.SIM_SPEED;
    this._updatePhysics(rdT * this.SIM_SPEED);

    this._publishAccum += rdT * 1000;
    if (this._publishAccum >= this.PUBLISH_MS) {
      this._publishAccum = 0;
      this._publish();
    }
  }

  private _updatePhysics(dt: number): void {
    const s = this._state;

    // ── Auto-SCRAM ──────────────────────────────────────
    if (s.coreTemp > this.SCRAM_TEMP && !s.isScrammed) {
      this.scram();
      this._log('ALERT', `AUTO-SCRAM: Core ${Math.round(s.coreTemp)}°C > ${this.SCRAM_TEMP}°C`);
    }

    // ── Reactivity factors ──────────────────────────────
    const kRod   = 1 - s.rodInsertion / 100;
    const kXenon = 1 - (s.xenonLevel / 100) * 0.72;
    const kTemp  = 1 - Math.max(0, (s.coreTemp - 295) / 190) * 0.45;
    const kCool  = s.pumpSpeed < 5 ? 0.2 : 1;
    const reactivity = Math.max(0, kRod * kXenon * kTemp * kCool);

    // ── Neutron flux — analytical (already stable in original) ──
    //   dφ/dt = (target - φ) / τ  →  φ(t) = target + (φ₀ - target)·e^{-dt/τ}
    const targetFlux = reactivity * 102;
    const tau        = 2.5;
    s.neutronFlux   += (targetFlux - s.neutronFlux) * (1 - Math.exp(-dt / tau));
    s.neutronFlux    = Math.max(0, Math.min(100, s.neutronFlux));

    const fluxN    = s.neutronFlux / 100;
    const flowEff  = s.pumpSpeed / 100;

    // ── Core temperature — analytical (STABILITY FIX) ────────────
    //   The ODE is:  dT'/dt = A - B·T'   where T' = T - T_inlet
    //
    //   A = heat-generation rate  = (φ/100) · 280   [°C/sim-s]
    //   B = heat-removal coeff    = flowEff · 2.2    [1/sim-s]
    //
    //   Euler was unstable when B·dt > 2 (e.g. 100 % pump at 50 ms
    //   interval → B·dt = 3.3).  Analytical solution is unconditionally
    //   stable:
    //     T'_ss = A / B
    //     T'(t) = T'_ss + (T'₀ - T'_ss) · e^{-B·dt}
    {
      const A      = fluxN * 280;
      const B      = flowEff * 2.2;
      const T0p    = s.coreTemp - this.INLET_TEMP;   // current T' above inlet
      let   newTp: number;
      if (B > 1e-4) {
        const Tss = A / B;                            // steady-state T'
        newTp     = Tss + (T0p - Tss) * Math.exp(-B * dt);
      } else {
        // Pump effectively off: pure heat accumulation
        newTp = T0p + A * dt;
      }
      s.coreTemp       = Math.max(this.INLET_TEMP, this.INLET_TEMP + newTp);
      s.coolantOutTemp = s.coreTemp;
    }

    // ── Xenon-135 — analytical (STABILITY FIX) ───────────────────
    //   The ODE is:  dx/dt = a - b·x
    //
    //   a = buildup rate  = fluxN · 2.8
    //   b = (decay + burnup) coefficient per unit xe
    //     = (0.12 + fluxN · 1.8) / 100      [1/sim-s  at xe expressed 0-100]
    //
    //   Analytical: x_ss = a/b,  x(t) = x_ss + (x₀ - x_ss)·e^{-b·dt}
    {
      const a  = fluxN * 2.8;
      const b  = (0.12 + fluxN * 1.8) / 100;
      let   newXe: number;
      if (b > 1e-6) {
        const xss = a / b;
        newXe     = xss + (s.xenonLevel - xss) * Math.exp(-b * dt);
      } else {
        // Zero flux, negligible decay: linear decay only
        newXe = s.xenonLevel + a * dt - (s.xenonLevel / 100) * 0.12 * dt;
      }
      s.xenonLevel = Math.max(0, Math.min(100, newXe));
    }

    // ── Power output ────────────────────────────────────
    s.powerOutput  = fluxN * this.MAX_POWER_MWe * (s.turbineOn ? 0.33 : 0);
    s.thermalPower = fluxN * this.MAX_POWER_MWe / 0.33;

    // ── Steam pressure ──────────────────────────────────
    s.steamPressure = Math.max(0, (s.coreTemp - 282) / 50) * 160;

    // ── Meltdown risk ────────────────────────────────────
    s.meltdownRisk = Math.max(0, Math.min(100, (s.coreTemp - 360) / 70 * 100));

    // ── Status transition ────────────────────────────────
    const prev = s.reactorStatus;
    let next: ReactorStatus;
    if      (s.isScrammed)       next = 'SCRAM';
    else if (s.neutronFlux < 2)  next = 'SHUTDOWN';
    else if (s.neutronFlux < 20) next = 'SUBCRITICAL';
    else if (s.neutronFlux < 75) next = 'PARTIAL POWER';
    else                         next = 'FULL POWER';
    if (prev !== next) { s.reactorStatus = next; this._log('SYS', `Status → ${next}`); }

    // ── Warnings ─────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════
  //  Utilities
  // ══════════════════════════════════════════════════════

  _log(type: LogType, msg: string): void {
    this._state.events.unshift({ id: ++this._eventId, type, msg, time: this._fmtTime() });
    if (this._state.events.length > 20) this._state.events.pop();
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
