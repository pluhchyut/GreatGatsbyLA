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

// Per-visual camera "home" — each scene was authored against a specific
// camera position. Crossfading also lerps the camera between these,
// which gives the page a real cinematic-cut feeling.
const CAMERA_HOMES = {
  greenLight:    { pos: new THREE.Vector3(0,    1.6, 0.0), look: new THREE.Vector3(0,    1.4,  -22) },
  goldParticles: { pos: new THREE.Vector3(0,    2.0, 6.0), look: new THREE.Vector3(0,    3.5,  -4)  },
  mansion:       { pos: new THREE.Vector3(0,    2.4, 0.0), look: new THREE.Vector3(0,    2.0,  -14) },
  artDeco:       { pos: new THREE.Vector3(0,    1.5, 1.0), look: new THREE.Vector3(0,    1.5,  -6)  },
  vortex:        { pos: new THREE.Vector3(0,    1.5, 1.4), look: new THREE.Vector3(0,    1.5,  -5)  },
  boat:          { pos: new THREE.Vector3(-1.2, 1.4, 1.6), look: new THREE.Vector3(2.5,  0.6,  -4)  },
};

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
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.fog = null;

    this.camera = new THREE.PerspectiveCamera(
      52, window.innerWidth / window.innerHeight, 0.1, 200,
    );
    this.camera.position.set(0, 1.6, 0);
    this.camera.lookAt(0, 1.4, -22);
    this._lookAt = new THREE.Vector3(0, 1.4, -22);

    // Build all sub-scenes
    this.visuals = {
      greenLight:    new GreenLightScene(this.scene),
      goldParticles: new GoldParticlesScene(this.scene),
      mansion:       new MansionScene(this.scene),
      artDeco:       new ArtDecoScene(this.scene),
      vortex:        new VortexScene(this.scene),
      boat:          new BoatScene(this.scene),
    };

    // Per-visual fade state for crossfades
    this.fade = {};
    this.fadeTarget = {};
    Object.keys(this.visuals).forEach(k => {
      this.fade[k] = 0;
      this.fadeTarget[k] = 0;
    });

    this.activeKey = null;
    this.setActive('greenLight');
    this.fade.greenLight = 1; // skip the boot crossfade

    this.scrollProgress = 0;
    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);

    window.addEventListener('mousemove', (e) => {
      this.mouseTarget.x = (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  setActive(key) {
    if (key === this.activeKey || !this.visuals[key]) return;
    this.activeKey = key;
    Object.keys(this.fadeTarget).forEach(k => {
      this.fadeTarget[k] = (k === key) ? 1 : 0;
    });
    // Make sure all groups are mounted while fading; hide() is called
    // automatically once a fade reaches 0 in _tick.
    this.visuals[key].show();
  }

  setScrollProgress(p) {
    this.scrollProgress = p;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t  = this.clock.getElapsedTime();

    // --- Lerp fades + visibility management ---
    const FADE_RATE = 1.6; // ~0.6s crossfade
    let blendedPos  = new THREE.Vector3();
    let blendedLook = new THREE.Vector3();
    let totalWeight = 0;

    Object.keys(this.visuals).forEach(k => {
      const v = this.visuals[k];
      const tgt = this.fadeTarget[k];
      const cur = this.fade[k];
      const next = cur + (tgt - cur) * Math.min(1, dt * FADE_RATE);
      this.fade[k] = next;
      if (next < 0.005 && tgt === 0) {
        v.hide();
      } else {
        v.show();
      }
      if (v.setOpacity) v.setOpacity(next);

      // Camera blend
      const home = CAMERA_HOMES[k];
      if (home && next > 0.005) {
        blendedPos.addScaledVector(home.pos, next);
        blendedLook.addScaledVector(home.look, next);
        totalWeight += next;
      }
    });

    if (totalWeight > 0) {
      blendedPos.multiplyScalar(1 / totalWeight);
      blendedLook.multiplyScalar(1 / totalWeight);

      // Subtle parallax: mouse + scroll-driven sway
      this.mouse.x += (this.mouseTarget.x - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouseTarget.y - this.mouse.y) * 0.05;
      const sp = this.scrollProgress || 0;

      blendedPos.x += this.mouse.x * 0.35 + Math.sin(sp * Math.PI * 2.0) * 0.18;
      blendedPos.y += -this.mouse.y * 0.18 + Math.sin(sp * Math.PI) * 0.25;
      blendedPos.z += Math.sin(t * 0.15) * 0.08;

      this.camera.position.copy(blendedPos);
      this._lookAt.lerp(blendedLook, 0.08);
      this.camera.lookAt(this._lookAt);
    }

    // --- Update every visible visual ---
    Object.keys(this.visuals).forEach(k => {
      const v = this.visuals[k];
      const w = this.fade[k];
      if (w > 0.005) v.update(t, this.scrollProgress || 0, w);
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }
}
