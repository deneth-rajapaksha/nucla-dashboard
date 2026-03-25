import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

@Component({
  selector: 'app-particle-simulator',
  standalone: true,
  imports: [NgClass, MatIconModule],
  template: `
    <div class="flex flex-col h-full w-full gap-4">
      <!-- Simulator Area -->
      <div class="relative w-full flex-1 bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-700" #container>
        
        <!-- UI Overlay -->
        <div class="absolute top-4 left-4 z-10 text-white pointer-events-none flex flex-col gap-2">
          <h3 class="text-lg font-semibold text-blue-300 drop-shadow-md">Nuclear Fission Chain Reaction</h3>
          
          <!-- Heat Meter -->
          <div class="w-48 bg-slate-800 rounded-full h-4 border border-slate-600 overflow-hidden mt-2 shadow-inner">
            <div class="h-full transition-all duration-300" 
                 [style.width.%]="heatLevel"
                 [ngClass]="{'bg-blue-500': heatLevel < 30, 'bg-yellow-500': heatLevel >= 30 && heatLevel < 70, 'bg-red-500': heatLevel >= 70}">
            </div>
          </div>
          <div class="text-xs text-slate-400 font-medium">Core Temperature</div>

          <!-- Legend -->
          <div class="flex flex-col gap-1.5 mt-3 text-xs bg-slate-800/60 p-3 rounded-lg backdrop-blur-md border border-slate-700 shadow-lg">
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div> U-235 Atom (Target)</span>
            <span class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]"></div> Neutron (Trigger)</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-gray-500"></div> Xenon (Poison/Absorber)</span>
            <span class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-orange-500"></div> Fission Fragment</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="absolute top-4 right-4 z-20 flex gap-2">
          <button (click)="togglePause()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors border border-slate-600 shadow-md flex items-center gap-1">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">{{ isPaused ? 'play_arrow' : 'pause' }}</mat-icon>
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          <button (click)="resetSimulation()" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors border border-red-500 shadow-md flex items-center gap-1">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">refresh</mat-icon>
            Reset
          </button>
        </div>

        <!-- E=mc^2 Labels Container -->
        <div #labelsContainer class="absolute inset-0 pointer-events-none overflow-hidden z-10"></div>

        <!-- 3D Canvas -->
        <canvas #canvas class="w-full h-full cursor-crosshair block"></canvas>
      </div>

      <!-- Tips Section -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 shadow-sm shrink-0">
        <h4 class="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <mat-icon class="text-blue-600" style="font-size: 20px; width: 20px; height: 20px;">lightbulb</mat-icon>
          Simulator Tips
        </h4>
        <ul class="list-disc pl-6 space-y-1.5">
          <li><strong>The Trigger:</strong> Click or tap anywhere inside the reactor core to fire a neutron.</li>
          <li><strong>Chain Reaction:</strong> Watch as neutrons split U-235 atoms, releasing more neutrons, fragments (Ba & Kr), and energy ($E=mc^2$).</li>
          <li><strong>Xenon Poisoning:</strong> If the core temperature drops too low, grey Xenon gas atoms will persist. They absorb neutrons and can kill the reaction. Keep the heat up!</li>
        </ul>
      </div>
    </div>
  `,
  styles: []
})
export class ParticleSimulatorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container') private containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('labelsContainer') private labelsContainer!: ElementRef<HTMLDivElement>;
  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private animationId: number = 0;
  private raycaster = new THREE.Raycaster();
  
  // Simulation State
  isPaused = false;
  heatLevel = 0;
  
  // Entities
  private u235Atoms: THREE.Mesh[] = [];
  private neutrons: { mesh: THREE.Mesh, velocity: THREE.Vector3 }[] = [];
  private xenonAtoms: THREE.Mesh[] = [];
  private fragments: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
  private flashes: { mesh: THREE.Mesh, life: number, mat: THREE.Material }[] = [];
  
  // Geometries & Materials
  private u235Geo = new THREE.SphereGeometry(1.2, 16, 16);
  private u235Mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4, metalness: 0.1 });
  
  private neutronGeo = new THREE.SphereGeometry(0.4, 8, 8);
  private neutronMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
  
  private xenonGeo = new THREE.SphereGeometry(1.0, 16, 16);
  private xenonMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.8, transparent: true, opacity: 0.8 });
  
  private fragmentGeo = new THREE.SphereGeometry(0.6, 8, 8);
  private fragmentMat1 = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Orange
  private fragmentMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7 }); // Purple
  
  private flashGeo = new THREE.SphereGeometry(2, 16, 16);
  private flashMatBase = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.initThreeJs();
    this.resetSimulation();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
    
    // Dispose geometries and materials
    this.u235Geo.dispose();
    this.u235Mat.dispose();
    this.neutronGeo.dispose();
    this.neutronMat.dispose();
    this.xenonGeo.dispose();
    this.xenonMat.dispose();
    this.fragmentGeo.dispose();
    this.fragmentMat1.dispose();
    this.fragmentMat2.dispose();
    this.flashGeo.dispose();
    this.flashMatBase.dispose();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  resetSimulation() {
    // Clear existing entities
    [...this.u235Atoms, ...this.neutrons.map(n => n.mesh), ...this.xenonAtoms, ...this.fragments.map(f => f.mesh), ...this.flashes.map(f => f.mesh)].forEach(mesh => {
      this.scene.remove(mesh);
    });
    
    this.u235Atoms = [];
    this.neutrons = [];
    this.xenonAtoms = [];
    this.fragments = [];
    this.flashes = [];
    this.heatLevel = 0;
    this.labelsContainer.nativeElement.innerHTML = '';

    // Spawn U-235 Cloud
    for (let i = 0; i < 150; i++) {
      const atom = new THREE.Mesh(this.u235Geo, this.u235Mat);
      // Random position within a sphere
      const r = 25 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      atom.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      this.scene.add(atom);
      this.u235Atoms.push(atom);
    }
  }

  private initThreeJs() {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    this.camera.position.set(0, 0, 60);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 30);
    this.scene.add(dirLight);

    // Post-processing for Bloom
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    // Click to shoot neutron
    canvas.addEventListener('mousedown', this.onCanvasClick.bind(this));
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        this.fireNeutron(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.composer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private onCanvasClick(event: MouseEvent) {
    this.fireNeutron(event.clientX, event.clientY);
  }

  private fireNeutron(clientX: number, clientY: number) {
    if (this.isPaused) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    
    const n = new THREE.Mesh(this.neutronGeo, this.neutronMat);
    // Start slightly in front of camera
    n.position.copy(this.camera.position).add(this.raycaster.ray.direction.clone().multiplyScalar(5));
    
    // Shoot towards the ray direction
    const vel = this.raycaster.ray.direction.clone().multiplyScalar(1.2);
    
    this.scene.add(n);
    this.neutrons.push({ mesh: n, velocity: vel });
  }

  private triggerFission(pos: THREE.Vector3) {
    // Increase heat
    this.ngZone.run(() => {
      this.heatLevel = Math.min(100, this.heatLevel + 8);
    });

    // Energy Flash
    const flashMat = this.flashMatBase.clone();
    const flash = new THREE.Mesh(this.flashGeo, flashMat);
    flash.position.copy(pos);
    this.scene.add(flash);
    this.flashes.push({ mesh: flash, life: 1.0, mat: flashMat });

    // E=mc^2 Label
    this.spawnLabel(pos);

    // Fission Fragments (Ba & Kr or similar)
    for(let i=0; i<2; i++) {
      const frag = new THREE.Mesh(this.fragmentGeo, i === 0 ? this.fragmentMat1 : this.fragmentMat2);
      frag.position.copy(pos);
      const vel = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(0.3);
      this.scene.add(frag);
      this.fragments.push({ mesh: frag, velocity: vel, life: 1.0 });
    }

    // Secondary Neutrons (2 or 3)
    const numNeutrons = Math.random() < 0.5 ? 2 : 3;
    for(let i=0; i<numNeutrons; i++) {
      const n = new THREE.Mesh(this.neutronGeo, this.neutronMat);
      n.position.copy(pos);
      const vel = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(0.8);
      this.scene.add(n);
      this.neutrons.push({ mesh: n, velocity: vel });
    }

    // Xenon Poisoning Byproduct (Higher chance if temp is low, but we spawn it anyway and burn it off later)
    if (Math.random() < 0.4) {
      const xe = new THREE.Mesh(this.xenonGeo, this.xenonMat);
      xe.position.copy(pos).add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(2));
      this.scene.add(xe);
      this.xenonAtoms.push(xe);
    }
  }

  private spawnLabel(pos: THREE.Vector3) {
    const div = document.createElement('div');
    div.innerHTML = 'E=mc&sup2;';
    div.className = 'absolute text-yellow-300 font-bold text-sm md:text-base pointer-events-none drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] z-10';
    
    const vector = pos.clone();
    vector.project(this.camera);
    
    const container = this.labelsContainer.nativeElement;
    const x = (vector.x * .5 + .5) * container.clientWidth;
    const y = (vector.y * -.5 + .5) * container.clientHeight;
    
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.transform = 'translate(-50%, -50%)';
    
    container.appendChild(div);
    
    let op = 1;
    let currentY = y;
    const animateLabel = () => {
      if (this.isPaused) {
        requestAnimationFrame(animateLabel);
        return;
      }
      op -= 0.015;
      currentY -= 0.5;
      div.style.opacity = op.toString();
      div.style.top = currentY + 'px';
      
      if (op <= 0) {
        div.remove();
      } else {
        requestAnimationFrame(animateLabel);
      }
    };
    requestAnimationFrame(animateLabel);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    if (!this.isPaused) {
      // Heat Decay
      if (this.heatLevel > 0) {
        this.ngZone.run(() => {
          this.heatLevel = Math.max(0, this.heatLevel - 0.15);
        });
      }

      // Xenon Burn-off (High Temp destroys Xenon)
      if (this.heatLevel > 50) {
        for (let i = this.xenonAtoms.length - 1; i >= 0; i--) {
          if (Math.random() < 0.02) { // 2% chance per frame to burn off
            this.scene.remove(this.xenonAtoms[i]);
            this.xenonAtoms.splice(i, 1);
          }
        }
      }

      // Move Neutrons & Check Collisions
      for (let i = this.neutrons.length - 1; i >= 0; i--) {
        const n = this.neutrons[i];
        n.mesh.position.add(n.velocity);

        // Remove if out of bounds
        if (n.mesh.position.length() > 80) {
          this.scene.remove(n.mesh);
          this.neutrons.splice(i, 1);
          continue;
        }

        let collision = false;

        // Check U-235 Collision
        for (let j = this.u235Atoms.length - 1; j >= 0; j--) {
          const atom = this.u235Atoms[j];
          if (n.mesh.position.distanceTo(atom.position) < 1.6) {
            this.triggerFission(atom.position);
            this.scene.remove(atom);
            this.u235Atoms.splice(j, 1);
            collision = true;
            break;
          }
        }

        if (collision) {
          this.scene.remove(n.mesh);
          this.neutrons.splice(i, 1);
          continue;
        }

        // Check Xenon Collision (Poisoning)
        for (let j = this.xenonAtoms.length - 1; j >= 0; j--) {
          const xe = this.xenonAtoms[j];
          if (n.mesh.position.distanceTo(xe.position) < 1.4) {
            // Neutron absorbed, reaction killed
            this.scene.remove(xe);
            this.xenonAtoms.splice(j, 1);
            collision = true;
            break;
          }
        }

        if (collision) {
          this.scene.remove(n.mesh);
          this.neutrons.splice(i, 1);
          continue;
        }
      }

      // Update Flashes
      for (let i = this.flashes.length - 1; i >= 0; i--) {
        const f = this.flashes[i];
        f.life -= 0.05;
        f.mesh.scale.addScalar(0.2);
        f.mat.opacity = f.life;
        if (f.life <= 0) {
          this.scene.remove(f.mesh);
          f.mat.dispose();
          this.flashes.splice(i, 1);
        }
      }

      // Update Fragments
      for (let i = this.fragments.length - 1; i >= 0; i--) {
        const frag = this.fragments[i];
        frag.mesh.position.add(frag.velocity);
        frag.life -= 0.01;
        if (frag.life <= 0) {
          this.scene.remove(frag.mesh);
          this.fragments.splice(i, 1);
        }
      }

      // Slowly rotate the U-235 cloud for visual effect
      this.scene.rotation.y += 0.001;
      this.scene.rotation.x += 0.0005;
    }

    // Render using composer for bloom
    this.composer.render();
  }
}
