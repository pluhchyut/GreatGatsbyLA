// Three.js stage: persistent canvas, single renderer.
// Manages all sub-scenes (visuals) and crossfades between them based on
// which scroll section is currently active.

import * as THREE from 'three';
import { GreenLightScene }    from './visuals/greenLight.js';
import { GoldParticlesScene } from './visuals/goldParticles.js';
import { MansionScene }       from './visuals/mansion.js';
import { ArtDecoScene }       from './visuals/artDeco.js';
import { VortexScene }        from './visuals/vortex.js';
import { BoatScene }          from './visuals/boat.js';

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setClearColor(0x07101c, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = null;

    this.camera = new THREE.PerspectiveCamera(
      52, window.innerWidth / window.innerHeight, 0.1, 200,
    );
    this.camera.position.set(0, 1.6, 0);
    this.camera.lookAt(0, 1.6, -10);

    // Build all sub-scenes
    this.visuals = {
      greenLight:    new GreenLightScene(this.scene),
      goldParticles: new GoldParticlesScene(this.scene),
      mansion:       new MansionScene(this.scene),
      artDeco:       new ArtDecoScene(this.scene),
      vortex:        new VortexScene(this.scene),
      boat:          new BoatScene(this.scene),
    };

    this.activeKey = null;
    this.setActive('greenLight');

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  setActive(key) {
    if (key === this.activeKey || !this.visuals[key]) return;
    if (this.activeKey) this.visuals[this.activeKey].hide();
    this.activeKey = key;
    this.visuals[key].show();
  }

  // Optional: subtle camera parallax based on overall page scroll progress.
  setScrollProgress(p) {
    this.scrollProgress = p;
    // Slow drift forward as you read
    this.camera.position.y = 1.6 + Math.sin(p * Math.PI) * 0.4;
    this.camera.position.x = Math.sin(p * Math.PI * 2) * 0.25;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  _tick() {
    const t = this.clock.getElapsedTime();
    Object.values(this.visuals).forEach(v => v.update(t, this.scrollProgress || 0));
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }
}
