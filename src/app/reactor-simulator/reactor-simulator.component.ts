// ============================================================
//  reactor-simulator.component.ts  (FIXED)
//  Root "smart" component — wires services to the template.
//  Uses OnPush change detection: only re-renders when state$
//  emits, keeping frame-rate impact minimal.
//
//  Key changes vs original:
//  1. Slider input is RAF-throttled: during a fast drag, the UI
//     value updates immediately for responsiveness, but the physics
//     service is only notified once per animation frame (via
//     requestAnimationFrame), preventing thousands of redundant
//     setRodInsertion/setPumpSpeed calls per second on mobile.
//  2. _inputRaf handle tracked and cancelled in ngOnDestroy.
// ============================================================
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ReactorSimulatorService } from './services/reactor-simulator.service';
import { ReactorRendererService }  from './services/reactor-renderer.service';
import { ReactorState, ReactorStatus } from './models/reactor.models';

const STATUS_CSS: Record<ReactorStatus, string> = {
  SHUTDOWN:       'shutdown',
  SUBCRITICAL:    'subcrit',
  'PARTIAL POWER':'partial',
  'FULL POWER':   'fullpower',
  SCRAM:          'scram',
};

@Component({
  selector: 'app-reactor-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reactor-simulator.component.html',
  styleUrls: ['./reactor-simulator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactorSimulatorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('reactorCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reactorPanel')  panelRef!:  ElementRef<HTMLDivElement>;

  // ── Bound state ────────────────────────────────────────
  state!: ReactorState;

  // ── Slider models (two-way binding) ────────────────────
  rodValue  = 100;
  pumpValue = 60;
  turbineOn = true;

  // ── Pending slider values for RAF-throttled flush ──────
  private _pendingRod:  number | null = null;
  private _pendingPump: number | null = null;
  private _inputRaf:    number | null = null;

  // ── Derived display values ─────────────────────────────
  get rodLabel(): string {
    if (this.rodValue === 100) return '100% (FULL IN)';
    if (this.rodValue === 0)   return '0% (WITHDRAWN)';
    return `${this.rodValue}%`;
  }

  get statusCssClass(): string {
    return this.state ? STATUS_CSS[this.state.reactorStatus] ?? 'shutdown' : 'shutdown';
  }

  get efficiency(): number {
    if (!this.state || this.state.powerOutput < 1) return 0;
    const thermal = (this.state.neutronFlux / 100) * 300 / 0.33;
    const eff     = Math.round((this.state.powerOutput / thermal) * 100);
    return Math.min(99, isNaN(eff) ? 0 : eff);
  }

  get gaugeFluxPct():  number { return this.state?.neutronFlux  ?? 0; }
  get gaugeTempPct():  number {
    return this.state
      ? Math.min(100, Math.max(0, (this.state.coreTemp - 280) / 170 * 100))
      : 0;
  }
  get gaugeXenonPct(): number { return this.state?.xenonLevel   ?? 0; }
  get gaugeSteamPct(): number {
    return this.state ? Math.min(100, this.state.steamPressure / 160 * 100) : 0;
  }
  get gaugeRiskPct():  number { return this.state?.meltdownRisk ?? 0; }

  get showXenonWarning(): boolean {
    return !!(this.state && this.state.xenonLevel > 55 && this.state.neutronFlux < 10);
  }
  get showTempWarning(): boolean {
    return !!(this.state && this.state.coreTemp > 380);
  }
  get showNegTempInfo(): boolean {
    return !!(this.state && this.state.neutronFlux > 40);
  }

  // ── RAF handle for render loop ─────────────────────────
  private _renderRaf:       number | null = null;
  private _sub!:            Subscription;
  private _resizeObserver!: ResizeObserver;

  constructor(
    private sim:  ReactorSimulatorService,
    private rndr: ReactorRendererService,
    private cdr:  ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  // ══════════════════════════════════════════════════════
  //  Lifecycle
  // ══════════════════════════════════════════════════════

  ngOnInit(): void {
    this._sub = this.sim.state$.subscribe((s) => {
      this.state = s;
      this.cdr.markForCheck();
    });
    this.sim.start();
    this.sim._log('SYS', 'SMR simulation started.');
    this.sim._log('INFO', 'Goal: sustain 300 MWe while managing Xe-135 and coolant temperature.');
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const panel  = this.panelRef.nativeElement;
    this.rndr.init(canvas);

    this.zone.runOutsideAngular(() => {
      this._resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          this.rndr.resize(width, height);
        }
      });
      this._resizeObserver.observe(panel);

      const loop = () => {
        this.rndr.render(this.sim.snapshot);
        this._renderRaf = requestAnimationFrame(loop);
      };
      this._renderRaf = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
    this.sim.pause();
    if (this._renderRaf !== null) cancelAnimationFrame(this._renderRaf);
    if (this._inputRaf  !== null) cancelAnimationFrame(this._inputRaf);
    this._resizeObserver?.disconnect();
  }

  // ══════════════════════════════════════════════════════
  //  Control event handlers
  //
  //  Slider onInput: update the visible label immediately (so the
  //  UI feels snappy) but queue the actual physics mutation for the
  //  next animation frame.  If the user drags 200 px in one frame
  //  we only call setRodInsertion once with the final value.
  // ══════════════════════════════════════════════════════

  onRodChange(value: number): void {
    this.rodValue    = value;        // UI label updates instantly
    this._pendingRod = value;
    this._scheduleInputFlush();
  }

  onPumpChange(value: number): void {
    this.pumpValue    = value;
    this._pendingPump = value;
    this._scheduleInputFlush();
  }

  private _scheduleInputFlush(): void {
    if (this._inputRaf !== null) return; // already scheduled for this frame
    this._inputRaf = requestAnimationFrame(() => {
      if (this._pendingRod  !== null) { this.sim.setRodInsertion(this._pendingRod);  this._pendingRod  = null; }
      if (this._pendingPump !== null) { this.sim.setPumpSpeed(this._pendingPump);     this._pendingPump = null; }
      this._inputRaf = null;
    });
  }

  onTurbineChange(value: boolean): void {
    this.turbineOn = value;
    this.sim.setTurbineOn(value);
  }

  onScram(): void {
    this.sim.scram();
    this.rodValue = 100;
  }

  onStartup(): void {
    this.sim.startup();
    this.rodValue  = 0;
    this.pumpValue = Math.max(60, this.pumpValue);
  }

  onReset(): void {
    this.sim.reset();
    this.rodValue  = 100;
    this.pumpValue = 60;
    this.turbineOn = true;
  }

  // ══════════════════════════════════════════════════════
  //  Template helpers
  // ══════════════════════════════════════════════════════

  simTime(): string { return this.sim._fmtTime(); }

  trackLogById(_: number, ev: { id: number }) { return ev.id; }
}
