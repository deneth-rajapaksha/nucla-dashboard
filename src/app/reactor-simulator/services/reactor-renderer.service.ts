// ============================================================
//  reactor-renderer.service.ts  v2
//
//  v2 changes:
//  • Particles clipped to their correct zones:
//      - Neutrons → strictly inside the CORE rectangle
//      - Water    → strictly inside the VESSEL rectangle
//      - Steam    → unclipped (rises to steam separators naturally)
//  • Emergency overlay: red pulse border + screen flash for events
//  • ECCS visual: blue injection streams at vessel top when active
//  • Blackout visual: dimmed canvas overlay
//  • Pressure relief visual: vent puff above vessel
//  • Layout cached; recomputed only on canvas resize
//  • Particle counters tracked (no repeated filter() passes)
// ============================================================
import { Injectable } from '@angular/core';
import { ReactorState } from '../models/reactor.models';

interface Particle {
  type: 'water' | 'steam' | 'neutron';
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  channel?: number;
}

interface Layout {
  W: number; H: number; cx: number; cy: number;
  containment: { x: number; y: number; w: number; h: number };
  vessel:      { x: number; y: number; w: number; h: number };
  core:        { x: number; y: number; w: number; h: number };
  steamSepL:   { cx: number; cy: number; r: number };
  steamSepR:   { cx: number; cy: number; r: number };
  pump:        { cx: number; cy: number; r: number };
  turbine:     { x: number; y: number; w: number; h: number };
}

@Injectable({ providedIn: 'root' })
export class ReactorRendererService {
  private canvas!: HTMLCanvasElement;
  private ctx!:    CanvasRenderingContext2D;
  private _particles: Particle[] = [];
  private _frame = 0;

  // Particle type counters
  private _nWater = 0; private _nSteam = 0; private _nNeutron = 0;

  // Cached layout
  private _layout: Layout | null = null;
  private _layoutW = 0; private _layoutH = 0;

  // Emergency flash state
  private _flashAlpha  = 0;  // 0-1, decays per frame
  private _prevEmMode: string | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d')!;
    const L     = this._getLayout();
    for (let i = 0; i < 80; i++) this._addParticle(this._spawnParticle('water',   0, L));
    for (let i = 0; i < 20; i++) this._addParticle(this._spawnParticle('steam',   0, L));
  }

  resize(w: number, h: number): void {
    if (!this.canvas) return;
    this.canvas.width  = w;
    this.canvas.height = h;
    this._layout = null; // invalidate cache
  }

  render(sim: ReactorState): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    this._frame++;

    // Trigger flash when emergency mode changes
    if (sim.emergencyMode !== this._prevEmMode) {
      if (sim.emergencyMode) this._flashAlpha = 1.0;
      this._prevEmMode = sim.emergencyMode;
    }

    ctx.clearRect(0, 0, W, H);
    const L = this._getLayout();

    this._updateParticles(sim, L);
    this._drawContainment(ctx, L, sim);
    this._drawPipes(ctx, L, sim);
    this._drawVessel(ctx, L, sim);
    this._drawCore(ctx, L, sim);
    this._drawControlRods(ctx, L, sim);
    this._drawParticles(ctx, L, sim);   // ← now properly clipped
    this._drawSteamSeparators(ctx, L, sim);
    this._drawPump(ctx, L, sim);
    this._drawTurbine(ctx, L, sim);
    this._drawECCSInjection(ctx, L, sim);
    this._drawPressureRelief(ctx, L, sim);
    this._drawLabels(ctx, L, sim);
    this._drawCoreGlow(ctx, L, sim);
    this._drawEmergencyOverlay(ctx, L, sim);
  }

  // ══ Layout (cached) ════════════════════════════════════════

  private _getLayout(): Layout {
    const W = this.canvas?.width  || 600;
    const H = this.canvas?.height || 500;
    if (this._layout && W === this._layoutW && H === this._layoutH) return this._layout;

    const cx    = W / 2;
    const cy    = H / 2;
    const coreW = Math.min(W * 0.38, 200);
    const coreH = Math.min(H * 0.50, 240);

    this._layout  = {
      W, H, cx, cy,
      containment: { x: 8, y: 8, w: W - 16, h: H - 16 },
      vessel:  { x: cx - coreW * 0.6, y: cy - coreH * 0.52, w: coreW * 1.2, h: coreH * 1.18 },
      core:    { x: cx - coreW / 2,   y: cy - coreH / 2,    w: coreW,        h: coreH },
      steamSepL: { cx: cx - coreW * 0.9, cy: cy - coreH * 0.15, r: Math.min(32, coreW * 0.16) },
      steamSepR: { cx: cx + coreW * 0.9, cy: cy - coreH * 0.15, r: Math.min(32, coreW * 0.16) },
      pump:    { cx, cy: cy + coreH * 0.7, r: 22 },
      turbine: { x: W - 100, y: H - 90, w: 80, h: 65 },
    };
    this._layoutW = W; this._layoutH = H;
    return this._layout;
  }

  // ══ Particle helpers ═══════════════════════════════════════

  private _addParticle(p: Particle): void {
    this._particles.push(p);
    if      (p.type === 'water')   this._nWater++;
    else if (p.type === 'steam')   this._nSteam++;
    else                           this._nNeutron++;
  }

  private _spawnParticle(type: Particle['type'], pumpSpeed: number, L: Layout): Particle {
    const cx = L.core.x + L.core.w / 2;
    if (type === 'water') {
      const ch  = Math.floor(Math.random() * 13);
      const chX = L.core.x + 6 + (ch * (L.core.w - 12)) / 12;
      return {
        type: 'water', channel: ch,
        x: chX + (Math.random() - 0.5) * 4,
        y: L.core.y + L.core.h * (0.2 + Math.random() * 0.8),
        vx: 0, vy: -(0.4 + Math.random() * 0.8),
        life: Math.random(), maxLife: 1, size: 2 + Math.random() * 1.5,
      };
    } else if (type === 'steam') {
      const side = Math.random() > 0.5 ? 1 : -1;
      return {
        type: 'steam',
        x: cx + side * (L.core.w * 0.3) + (Math.random() - 0.5) * 20,
        y: L.core.y - 10 - Math.random() * 30,
        vx: side * (0.1 + Math.random() * 0.3), vy: -(0.3 + Math.random() * 0.5),
        life: Math.random(), maxLife: 1, size: 2 + Math.random() * 2,
      };
    } else {
      // Neutrons: spawn inside the CORE only
      return {
        type: 'neutron',
        x: L.core.x + 10 + Math.random() * (L.core.w - 20),
        y: L.core.y + 10 + Math.random() * (L.core.h - 20),
        vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5,
        life: Math.random(), maxLife: 0.6 + Math.random() * 0.4, size: 1.5 + Math.random(),
      };
    }
  }

  private _updateParticles(sim: ReactorState, L: Layout): void {
    const pumpN = sim.pumpSpeed / 100;
    const fluxN = sim.neutronFlux / 100;

    const next: Particle[] = [];
    let nW = 0, nS = 0, nN = 0;

    for (const p of this._particles) {
      p.life += 0.016;

      if (p.type === 'water') {
        p.vy = -(0.6 + pumpN * 2.5);
        p.y += p.vy;
        if (p.y < L.core.y - 20) {
          const fresh = this._spawnParticle('water', sim.pumpSpeed, L);
          Object.assign(p, fresh);
          p.y = L.core.y + L.core.h - 5; p.life = 0;
        }
        next.push(p); nW++;
      } else if (p.type === 'steam') {
        p.x += p.vx; p.y += p.vy * (0.5 + fluxN);
        if (p.y < L.core.y - L.core.h * 0.6 || p.life > 1.5) {
          const fresh = this._spawnParticle('steam', sim.pumpSpeed, L);
          Object.assign(p, fresh); p.life = 0;
        }
        next.push(p); nS++;
      } else {
        // Neutrons bounce strictly inside CORE
        p.x += p.vx; p.y += p.vy;
        if (p.x < L.core.x + 5)            { p.x = L.core.x + 5;            p.vx *= -1; }
        if (p.x > L.core.x + L.core.w - 5) { p.x = L.core.x + L.core.w - 5; p.vx *= -1; }
        if (p.y < L.core.y + 5)            { p.y = L.core.y + 5;            p.vy *= -1; }
        if (p.y > L.core.y + L.core.h - 5) { p.y = L.core.y + L.core.h - 5; p.vy *= -1; }
        if (p.life <= p.maxLife) { next.push(p); nN++; }
      }
    }
    this._particles = next;
    this._nWater = nW; this._nSteam = nS; this._nNeutron = nN;

    const targetNeutrons = Math.floor(fluxN * 60);
    if (this._nNeutron < targetNeutrons && Math.random() < 0.4)
      this._addParticle(this._spawnParticle('neutron', sim.pumpSpeed, L));

    const targetWater = Math.floor(30 + pumpN * 50);
    while (this._nWater < targetWater)
      this._addParticle(this._spawnParticle('water', sim.pumpSpeed, L));

    const targetSteam = Math.floor(fluxN * 30);
    if (this._nSteam < targetSteam)
      this._addParticle(this._spawnParticle('steam', sim.pumpSpeed, L));
  }

  // ══ Draw methods ═══════════════════════════════════════════

  private _drawContainment(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const c = L.containment;
    ctx.fillStyle = '#f0f5fc';
    ctx.beginPath(); (ctx as any).roundRect(c.x, c.y, c.w, c.h, 6); ctx.fill();
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 10;
    ctx.beginPath(); (ctx as any).roundRect(c.x, c.y, c.w, c.h, 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(74,158,255,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); (ctx as any).roundRect(c.x + 7, c.y + 7, c.w - 14, c.h - 14, 4); ctx.stroke();
  }

  private _drawPipes(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const fluxN = sim.neutronFlux / 100;
    const pumpN = sim.pumpSpeed / 100;
    const alpha = 0.4 + pumpN * 0.5;

    ctx.strokeStyle = `rgba(41,128,185,${alpha})`; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(L.pump.cx, L.pump.cy - L.pump.r); ctx.lineTo(L.pump.cx, L.vessel.y + L.vessel.h); ctx.stroke();

    const steamAlpha = 0.3 + fluxN * 0.5;
    const steamColor = fluxN > 0.3 ? `rgba(168,212,245,${steamAlpha})` : `rgba(41,128,185,${alpha * 0.6})`;
    ctx.strokeStyle = steamColor; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(L.vessel.x + L.vessel.w * 0.3, L.vessel.y); ctx.quadraticCurveTo(L.vessel.x + L.vessel.w * 0.3, L.vessel.y - 30, L.steamSepL.cx, L.steamSepL.cy + L.steamSepL.r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L.vessel.x + L.vessel.w * 0.7, L.vessel.y); ctx.quadraticCurveTo(L.vessel.x + L.vessel.w * 0.7, L.vessel.y - 30, L.steamSepR.cx, L.steamSepR.cy + L.steamSepR.r); ctx.stroke();

    ctx.strokeStyle = `rgba(41,128,185,${alpha * 0.6})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(L.steamSepL.cx, L.steamSepL.cy + L.steamSepL.r); ctx.lineTo(L.steamSepL.cx, L.pump.cy); ctx.lineTo(L.pump.cx, L.pump.cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L.steamSepR.cx, L.steamSepR.cy + L.steamSepR.r); ctx.lineTo(L.steamSepR.cx, L.pump.cy); ctx.lineTo(L.pump.cx, L.pump.cy); ctx.stroke();

    if (fluxN > 0.05) {
      ctx.strokeStyle = `rgba(200,230,255,${fluxN * 0.8})`; ctx.lineWidth = 8; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(L.steamSepL.cx, L.steamSepL.cy - L.steamSepL.r); ctx.lineTo(L.steamSepL.cx, L.containment.y + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L.steamSepR.cx, L.steamSepR.cy - L.steamSepR.r); ctx.lineTo(L.steamSepR.cx, L.containment.y + 15); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private _drawVessel(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const v = L.vessel;
    const hotness = Math.min(1, Math.max(0, (sim.coreTemp - 285) / 150));
    ctx.shadowColor = 'rgba(0,30,80,0.2)'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#dde8f8'; ctx.beginPath(); (ctx as any).roundRect(v.x, v.y, v.w, v.h, 10); ctx.fill();
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(v.x, v.y + v.h, v.x, v.y);
    grad.addColorStop(0, `rgba(41,128,185,0.8)`);
    grad.addColorStop(1, `rgba(${Math.round(41 + hotness * 210)},${Math.round(128 - hotness * 100)},${Math.round(185 - hotness * 160)},0.6)`);
    ctx.fillStyle = grad; ctx.beginPath(); (ctx as any).roundRect(v.x + 4, v.y + 4, v.w - 8, v.h - 8, 8); ctx.fill();
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 5; ctx.beginPath(); (ctx as any).roundRect(v.x, v.y, v.w, v.h, 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(147,197,253,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); (ctx as any).roundRect(v.x + 3, v.y + 3, v.w - 6, v.h - 6, 8); ctx.stroke();
  }

  private _drawCore(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const c = L.core; const fluxN = sim.neutronFlux / 100;
    const nCh = 13; const chW = (c.w - 16) / nCh; const chGap = 2; const fuelW = chW - chGap * 2;

    ctx.fillStyle = `rgb(${Math.round(88 + fluxN * 30)},${Math.round(107 + fluxN * 10)},${Math.round(126 - fluxN * 20)})`;
    ctx.beginPath(); (ctx as any).roundRect(c.x, c.y, c.w, c.h, 4); ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    for (let gx = c.x; gx < c.x + c.w; gx += 16) { ctx.beginPath(); ctx.moveTo(gx, c.y); ctx.lineTo(gx, c.y + c.h); ctx.stroke(); }
    for (let gy = c.y; gy < c.y + c.h; gy += 16) { ctx.beginPath(); ctx.moveTo(c.x, gy); ctx.lineTo(c.x + c.w, gy); ctx.stroke(); }

    const hotness = Math.min(1, fluxN * 1.1);
    const rBase   = Math.round(130 + hotness * 120);
    const gBase   = Math.round(70  - hotness * 50);
    const bBase   = Math.round(50  - hotness * 40);
    const rHot    = Math.min(255, rBase + 40);

    if (hotness > 0.05) {
      ctx.save();
      ctx.shadowColor = `rgba(255,${Math.round(150 - hotness * 100)},0,${hotness * 0.6})`;
      ctx.shadowBlur  = fuelW * 2;
      ctx.fillStyle   = `rgba(${rBase},${gBase},${bBase},0.01)`;
      for (let i = 0; i < nCh; i++) {
        const fx = c.x + 8 + i * chW + chGap; const fy = c.y + 8; const fh = c.h - 16;
        ctx.fillRect(fx, fy + 2, fuelW, fh - 4);
      }
      ctx.restore();
    }

    for (let i = 0; i < nCh; i++) {
      const fx = c.x + 8 + i * chW + chGap; const fy = c.y + 8; const fh = c.h - 16;
      ctx.fillStyle = `rgba(30,90,170,0.5)`; ctx.fillRect(fx - 1, fy, fuelW + 2, fh);
      const fuelGrad = ctx.createLinearGradient(fx, fy, fx + fuelW, fy);
      fuelGrad.addColorStop(0,   `rgba(${rBase},${gBase},${bBase},0.9)`);
      fuelGrad.addColorStop(0.5, `rgba(${rHot},${gBase},${bBase},1)`);
      fuelGrad.addColorStop(1,   `rgba(${rBase},${gBase},${bBase},0.9)`);
      ctx.fillStyle = fuelGrad; ctx.fillRect(fx, fy + 2, fuelW, fh - 4);
      ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 0.5;
      for (let seg = 1; seg < 8; seg++) {
        const sy = fy + (fh / 8) * seg;
        ctx.beginPath(); ctx.moveTo(fx, sy); ctx.lineTo(fx + fuelW, sy); ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(100,150,220,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); (ctx as any).roundRect(c.x, c.y, c.w, c.h, 4); ctx.stroke();
  }

  private _drawControlRods(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const c = L.core; const nRods = 13; const insertion = sim.rodInsertion / 100;
    const chW = (c.w - 16) / nRods; const rodW = Math.max(2, chW * 0.35);
    const maxLen = c.h - 8; const rodLen = maxLen * insertion;

    for (let i = 0; i < nRods; i++) {
      const rx = c.x + 8 + i * chW + chW / 2 - rodW / 2; const ry = c.y;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(rx - 1, ry, rodW + 2, rodLen + 3);
      const g = ctx.createLinearGradient(rx, 0, rx + rodW, 0);
      g.addColorStop(0, '#1a252f'); g.addColorStop(0.4, '#2c3e50'); g.addColorStop(1, '#1a252f');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rodW, rodLen);
      if (rodLen > 4) { ctx.fillStyle = '#7f8c8d'; ctx.fillRect(rx, ry + rodLen - 4, rodW, 4); }
      if (insertion < 0.99) {
        ctx.strokeStyle = 'rgba(100,130,170,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(rx + rodW / 2, L.vessel.y); ctx.lineTo(rx + rodW / 2, ry); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (insertion < 0.99) {
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(c.x, L.vessel.y, c.w, 6);
      ctx.fillStyle = '#3d5166'; ctx.fillRect(c.x, L.vessel.y, c.w, 2);
    }
  }

  /**
   * Draw particles with proper clipping zones:
   * - Water  → clipped to VESSEL bounds (stays inside the pressure vessel)
   * - Neutron → clipped to CORE bounds  (never bleeds into rod mechanism area)
   * - Steam  → no clip (rises naturally through pipes to steam separators)
   */
  private _drawParticles(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const fluxN = sim.neutronFlux / 100;
    const pumpN = sim.pumpSpeed / 100;

    // ── Water particles (clipped to vessel) ──────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.vessel.x, L.vessel.y, L.vessel.w, L.vessel.h);
    ctx.clip();
    for (const p of this._particles) {
      if (p.type !== 'water') continue;
      const alpha   = 0.4 + pumpN * 0.5;
      const hotness = Math.min(1, Math.max(0, (p.y - (L.core.y + L.core.h * 0.5)) / (L.core.h * 0.5)));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(30 + hotness * 200)},${Math.round(130 - hotness * 50)},200,${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    // ── Steam particles (no clip — rises to separators) ──────
    if (fluxN > 0.05) {
      for (const p of this._particles) {
        if (p.type !== 'steam') continue;
        const lifeRatio = Math.min(1, p.life / p.maxLife);
        const fadeAlpha = 1 - Math.pow(lifeRatio, 2);
        const alpha = fluxN * 0.5 * fadeAlpha;
        const size  = p.size * (1 + lifeRatio);
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,230,255,${alpha})`; ctx.fill();
      }
    }

    // ── Neutron particles (clipped STRICTLY to CORE) ─────────
    if (fluxN > 0.02) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(L.core.x, L.core.y, L.core.w, L.core.h);
      ctx.clip();
      for (const p of this._particles) {
        if (p.type !== 'neutron') continue;
        const lifeRatio = Math.min(1, p.life / p.maxLife);
        const fadeAlpha = 1 - Math.pow(lifeRatio, 2);
        const alpha = fluxN * fadeAlpha * 0.9;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243,156,18,${alpha})`; ctx.fill();
        const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        ng.addColorStop(0, `rgba(255,200,50,${alpha * 0.4})`);
        ng.addColorStop(1, 'rgba(255,200,50,0)');
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  private _drawSteamSeparators(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const fluxN = sim.neutronFlux / 100; const steamAlpha = 0.5 + fluxN * 0.4;
    for (const sep of [L.steamSepL, L.steamSepR]) {
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#dde8f8'; ctx.beginPath(); ctx.arc(sep.cx, sep.cy, sep.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      const sg = ctx.createRadialGradient(sep.cx, sep.cy - sep.r * 0.3, 2, sep.cx, sep.cy, sep.r);
      sg.addColorStop(0, `rgba(200,230,255,${steamAlpha})`); sg.addColorStop(1, `rgba(180,220,255,${steamAlpha * 0.5})`);
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sep.cx, sep.cy, sep.r - 3, 0, Math.PI * 2); ctx.fill();
      const waterLevel = sep.r * (0.3 + (1 - fluxN) * 0.3);
      ctx.save(); ctx.beginPath(); ctx.arc(sep.cx, sep.cy, sep.r - 3, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = `rgba(41,128,185,0.7)`; ctx.fillRect(sep.cx - sep.r, sep.cy + sep.r - waterLevel * 2, sep.r * 2, waterLevel * 2);
      ctx.restore();
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sep.cx, sep.cy, sep.r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(100,150,220,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sep.cx - sep.r + 3, sep.cy); ctx.lineTo(sep.cx + sep.r - 3, sep.cy); ctx.stroke();
    }
  }

  private _drawPump(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const p = L.pump; const pumpN = sim.pumpSpeed / 100;
    const angle = (this._frame * 0.08 * pumpN) % (Math.PI * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8;
    ctx.fillStyle = pumpN > 0.1 ? '#1a6fba' : '#7f8c8d';
    ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = pumpN > 0.1 ? '#2980b9' : '#95a5a6';
    ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 5, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(p.cx, p.cy); ctx.rotate(angle);
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2); ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.ellipse(0, -p.r * 0.4, 2, p.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(p.cx, p.cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pumpN > 0.1 ? '#1e3799' : '#5d6d7e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.stroke();
  }

  private _drawTurbine(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const t = L.turbine; const powerN = sim.powerOutput / 300; const turbOn = sim.turbineOn;
    if (!turbOn || powerN < 0.02) ctx.globalAlpha = 0.35;
    const angle  = (this._frame * 0.05 * powerN) % (Math.PI * 2);
    const cx = t.x + t.w / 2; const cy = t.y + t.h / 2; const rOuter = t.w * 0.38;
    ctx.fillStyle = '#1a252f'; ctx.beginPath(); (ctx as any).roundRect(t.x, t.y, t.w, t.h, 8); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    for (let i = 0; i < 6; i++) {
      ctx.rotate((Math.PI * 2) / 6);
      ctx.fillStyle = turbOn && powerN > 0.1 ? `rgba(74,158,255,${0.6 + powerN * 0.4})` : 'rgba(100,130,160,0.5)';
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(rOuter * 0.7, -rOuter * 0.2);
      ctx.quadraticCurveTo(rOuter, 0, rOuter * 0.7, rOuter * 0.2); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = turbOn ? '#4a9eff' : '#5d6d7e'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = turbOn ? '#2563eb' : '#3d5166'; ctx.lineWidth = 1.5;
    ctx.beginPath(); (ctx as any).roundRect(t.x, t.y, t.w, t.h, 8); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** ECCS: animated blue injection streams entering from top of vessel */
  private _drawECCSInjection(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    if (!sim.eccsActive) return;
    const t = (this._frame * 0.04) % 1;
    const v = L.vessel;
    // Two injection nozzles symmetrically placed at top of vessel
    for (let s = -1; s <= 1; s += 2) {
      const nx = v.x + v.w / 2 + s * v.w * 0.22;
      const ny = v.y;
      // Draw injection pipe
      ctx.strokeStyle = `rgba(0,180,255,0.8)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(nx, ny - 18); ctx.lineTo(nx, ny); ctx.stroke();
      // Draw nozzle head
      ctx.fillStyle = '#00b4ff';
      ctx.beginPath(); ctx.arc(nx, ny - 18, 4, 0, Math.PI * 2); ctx.fill();
      // Animated droplets falling into vessel
      for (let d = 0; d < 4; d++) {
        const dropT = (t + d * 0.25) % 1;
        const dy    = ny + dropT * L.core.h * 0.6;
        const alpha = 1 - dropT;
        if (dy < v.y + v.h) {
          ctx.beginPath(); ctx.arc(nx, dy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,200,255,${alpha})`; ctx.fill();
        }
      }
    }
    // Label
    ctx.textAlign = 'center'; ctx.font = '700 9px "Segoe UI"';
    ctx.fillStyle = '#00b4ff';
    ctx.fillText('ECCS ACTIVE', v.x + v.w / 2, v.y - 22);
    ctx.textAlign = 'left';
  }

  /** Pressure relief: animated steam puff venting above the vessel */
  private _drawPressureRelief(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    if (!sim.pressureReliefOpen) return;
    const v  = L.vessel;
    const vx = v.x + v.w * 0.8;
    const vy = v.y;
    const t  = (this._frame * 0.06) % 1;
    // Vent pipe
    ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + 14, vy - 14); ctx.stroke();
    // Puff circles
    for (let p = 0; p < 3; p++) {
      const pt    = (t + p * 0.33) % 1;
      const px    = vx + 14 + pt * 20;
      const py    = vy - 14 - pt * 20;
      const pr    = 3 + pt * 8;
      const alpha = 0.7 * (1 - pt);
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,200,180,${alpha})`; ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.font = '700 8px "Segoe UI"';
    ctx.fillStyle = '#e67e22';
    ctx.fillText('PRV OPEN', vx + 14, vy - 36);
    ctx.textAlign = 'left';
  }

  private _drawCoreGlow(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    const fluxN = sim.neutronFlux / 100;
    if (fluxN < 0.02) return;
    const c = L.core; const cx = c.x + c.w / 2; const cy = c.y + c.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.w * 0.9);
    const R = Math.round(50  + fluxN * 205);
    const G = Math.round(100 - fluxN * 50);
    const B = Math.round(200 - fluxN * 180);
    glow.addColorStop(0, `rgba(${R},${G},${B},${fluxN * 0.25})`);
    glow.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, c.w * 0.9, 0, Math.PI * 2); ctx.fill();
  }

  /** Red pulsing border + screen flash for emergency events */
  private _drawEmergencyOverlay(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    // Decay flash alpha
    if (this._flashAlpha > 0) {
      ctx.fillStyle = `rgba(220,30,30,${this._flashAlpha * 0.18})`;
      ctx.fillRect(0, 0, L.W, L.H);
      this._flashAlpha = Math.max(0, this._flashAlpha - 0.025);
    }

    // Pulsing emergency border
    if (sim.emergencyMode) {
      const pulse = 0.5 + 0.5 * Math.sin(this._frame * 0.12);
      ctx.strokeStyle = `rgba(220,30,30,${0.4 + pulse * 0.5})`;
      ctx.lineWidth   = 4 + pulse * 3;
      ctx.beginPath();
      (ctx as any).roundRect(L.containment.x + 2, L.containment.y + 2,
                              L.containment.w - 4, L.containment.h - 4, 6);
      ctx.stroke();

      // Blackout dimming
      if (sim.emergencyMode === 'BLACKOUT' && !sim.dieselGenActive) {
        const dimPulse = 0.5 + 0.5 * Math.sin(this._frame * 0.05);
        ctx.fillStyle  = `rgba(0,0,0,${0.12 + dimPulse * 0.08})`;
        ctx.fillRect(0, 0, L.W, L.H);
      }
    }
  }

  private _drawLabels(ctx: CanvasRenderingContext2D, L: Layout, sim: ReactorState): void {
    ctx.textAlign = 'center';
    const labels = [
      { x: L.core.x + L.core.w / 2, y: L.core.y - 22, txt: 'REACTOR CORE', color: '#2563eb', bold: true },
      { x: L.steamSepL.cx, y: L.steamSepL.cy + L.steamSepL.r + 14, txt: 'Steam Sep.', color: '#3d5a80', bold: false },
      { x: L.steamSepR.cx, y: L.steamSepR.cy + L.steamSepR.r + 14, txt: 'Steam Sep.', color: '#3d5a80', bold: false },
      { x: L.pump.cx,      y: L.pump.cy + L.pump.r + 14, txt: 'Coolant Pump', color: '#3d5a80', bold: false },
      { x: L.turbine.x + L.turbine.w / 2, y: L.turbine.y - 7, txt: 'TURBINE', color: '#4a9eff', bold: false },
      { x: L.containment.x + L.containment.w / 2, y: L.containment.y + 22, txt: 'CONTAINMENT STRUCTURE & RADIOLOGICAL SHIELD', color: '#1e3a5f', bold: false },
    ];
    for (const lb of labels) {
      ctx.fillStyle = lb.color; ctx.font = lb.bold ? '700 10px "Segoe UI"' : '10px "Segoe UI"';
      ctx.fillText(lb.txt, lb.x, lb.y);
    }
    ctx.textAlign = 'left'; ctx.font = '700 11px "Courier New"';
    ctx.fillStyle = sim.coreTemp > 380 ? '#e74c3c' : sim.coreTemp > 340 ? '#e67e22' : '#2ecc71';
    ctx.fillText(`${Math.round(sim.coreTemp)}°C`, L.vessel.x + 4, L.vessel.y + L.vessel.h - 6);
    ctx.textAlign = 'right'; ctx.fillStyle = sim.neutronFlux > 5 ? '#f39c12' : '#7f8c8d';
    ctx.fillText(`φ ${Math.round(sim.neutronFlux)}%`, L.vessel.x + L.vessel.w - 4, L.vessel.y + L.vessel.h - 6);
    ctx.textAlign = 'center'; ctx.font = '9px "Segoe UI"'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Graphite Moderator', L.core.x + L.core.w / 2, L.core.y + L.core.h - 6);
    ctx.textAlign = 'left';
  }
}
