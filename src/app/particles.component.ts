import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'proton' | 'neutron' | 'electron';
  life: number;
  maxLife: number;
}

@Component({
  selector: 'app-particles',
  standalone: true,
  template: `<canvas #canvas class="fixed inset-0 pointer-events-none z-50"></canvas>`,
})
export class ParticlesComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouseX = 0;
  private mouseY = 0;
  private isMouseMoving = false;
  private animationFrameId = 0;
  private mouseTimeout: ReturnType<typeof setTimeout> | undefined;

  private ngZone = inject(NgZone);

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.mouseTimeout);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.isMouseMoving = true;

    clearTimeout(this.mouseTimeout);
    this.mouseTimeout = setTimeout(() => {
      this.isMouseMoving = false;
    }, 100);

    // Spawn particles on move
    if (Math.random() > 0.5) {
      this.spawnParticle();
    }
  }

  private spawnParticle() {
    const types: ('proton' | 'neutron' | 'electron')[] = ['proton', 'neutron', 'electron'];
    const type = types[Math.floor(Math.random() * types.length)];

    let color = '';
    let radius = 0;

    switch (type) {
      case 'proton':
        color = '#00008b'; // dark blue
        radius = Math.random() * 2 + 2;
        break;
      case 'neutron':
        color = '#b2beb5'; // ash
        radius = Math.random() * 2 + 2;
        break;
      case 'electron':
        color = '#3b82f6'; // light blue
        radius = Math.random() * 1 + 1;
        break;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;

    this.particles.push({
      x: this.mouseX + (Math.random() - 0.5) * 20,
      y: this.mouseY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color,
      type,
      life: 0,
      maxLife: Math.random() * 50 + 50,
    });
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Orbit effect around mouse if moving, else scatter
      if (this.isMouseMoving) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const force = (100 - dist) / 100;
          if (p.type === 'electron') {
            // Electrons orbit fast
            p.vx += dy * 0.05 * force;
            p.vy -= dx * 0.05 * force;
          } else {
            // Protons/Neutrons pull towards center slightly
            p.vx += dx * 0.01 * force;
            p.vy += dy * 0.01 * force;
          }
        }
      }

      // Add some friction
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;

      // Draw
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = 1 - p.life / p.maxLife;
      this.ctx.fill();

      // Draw glow for electrons
      if (p.type === 'electron') {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
      } else {
        this.ctx.shadowBlur = 0;
      }
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}

