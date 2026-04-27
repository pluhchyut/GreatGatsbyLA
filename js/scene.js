// Three.js stage: persistent canvas, single renderer.
// Each chapter contributes a weighted state that drives camera movement,
// atmospheric blending, and per-scene animation intensity.

import * as THREE from 'three';
import { GreenLightScene } from './visuals/greenLight.js';
import { GoldParticlesScene } from './visuals/goldParticles.js';
import { MansionScene } from './visuals/mansion.js';
import { ArtDecoScene } from './visuals/artDeco.js';
import { VortexScene } from './visuals/vortex.js';
import { BoatScene } from './visuals/boat.js';

const CAMERA_POSES = {
  greenLight: {
    position: new THREE.Vector3(0.0, 2.1, 6.6),
    lookAt: new THREE.Vector3(0.0, 1.0, -18.0),
  },
  goldParticles: {
    position: new THREE.Vector3(0.0, 2.0, 6.1),
    lookAt: new THREE.Vector3(0.0, 2.2, -7.5),
  },
  mansion: {
    position: new THREE.Vector3(0.0, 3.4, 8.7),
    lookAt: new THREE.Vector3(0.0, 2.2, -13.4),
  },
  artDeco: {
    position: new THREE.Vector3(0.0, 1.9, 5.7),
    lookAt: new THREE.Vector3(0.0, 1.6, -6.0),
  },
  vortex: {
    position: new THREE.Vector3(0.0, 1.7, 6.2),
    lookAt: new THREE.Vector3(0.0, 1.5, -5.0),
  },
  boat: {
    position: new THREE.Vector3(1.7, 2.0, 7.8),
    lookAt: new THREE.Vector3(1.1, 0.8, -8.0),
  },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setClearColor(0x07101c, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.fog = null;

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      220,
    );
    this.camera.position.set(0, 2.0, 6.8);

    this.lookTarget = new THREE.Vector3(0, 1.4, -12);
    this.tmpPosition = new THREE.Vector3();
    this.tmpLookAt = new THREE.Vector3();

    this.visuals = {
      greenLight: new GreenLightScene(this.scene),
      goldParticles: new GoldParticlesScene(this.scene),
      mansion: new MansionScene(this.scene),
      artDeco: new ArtDecoScene(this.scene),
      vortex: new VortexScene(this.scene),
      boat: new BoatScene(this.scene),
    };

    this.sceneStates = Object.fromEntries(
      Object.keys(this.visuals).map((key) => [key, {
        intensity: key === 'greenLight' ? 1 : 0,
        targetIntensity: key === 'greenLight' ? 1 : 0,
        progress: 0,
        targetProgress: 0,
      }]),
    );

    this.scroll = { progress: 0, velocity: 0, direction: 1 };
    this.dominantKey = 'greenLight';
    this.activeBeat = {
      scene: 'greenLight',
      chapter: 'shoreline',
      shot: '',
      transition: '',
      progress: 0,
      entryId: '',
    };
    this.clock = new THREE.Clock();

    this.visuals.greenLight.setState({ intensity: 1, progress: 0, dominant: true });

    window.addEventListener('resize', () => this.onResize());
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  setSceneStates(states, dominantKey) {
    this.dominantKey = dominantKey || this.dominantKey;

    Object.entries(this.sceneStates).forEach(([key, state]) => {
      state.targetIntensity = states[key]?.intensity ?? 0;
      state.targetProgress = states[key]?.progress ?? 0;
    });
  }

  setScrollMetrics(metrics) {
    this.scroll.progress = metrics.progress ?? this.scroll.progress;
    this.scroll.velocity = metrics.velocity ?? this.scroll.velocity;
    this.scroll.direction = metrics.direction ?? this.scroll.direction;
  }

  setActiveBeat(beat) {
    this.activeBeat = { ...this.activeBeat, ...beat };
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  _updateCamera(t) {
    this.tmpPosition.set(0, 0, 0);
    this.tmpLookAt.set(0, 0, 0);

    let totalWeight = 0;
    Object.entries(this.sceneStates).forEach(([key, state]) => {
      const weight = Math.pow(state.intensity, 1.4);
      if (weight < 0.0001) return;

      totalWeight += weight;
      this.tmpPosition.addScaledVector(CAMERA_POSES[key].position, weight);
      this.tmpLookAt.addScaledVector(CAMERA_POSES[key].lookAt, weight);
    });

    if (totalWeight < 0.0001) {
      totalWeight = 1;
      this.tmpPosition.copy(CAMERA_POSES.greenLight.position);
      this.tmpLookAt.copy(CAMERA_POSES.greenLight.lookAt);
    } else {
      this.tmpPosition.multiplyScalar(1 / totalWeight);
      this.tmpLookAt.multiplyScalar(1 / totalWeight);
    }

    const velocityNudge = THREE.MathUtils.clamp(this.scroll.velocity, -5, 5);
    const globalDrift = Math.sin(t * 0.18 + this.scroll.progress * Math.PI * 3.0);
    const verticalLift = Math.sin(this.scroll.progress * Math.PI) * 0.22;
    const beatWave = Math.sin((this.activeBeat.progress || 0) * Math.PI);
    const cinematicPush = (this.activeBeat.progress || 0) - 0.5;

    this.tmpPosition.x += velocityNudge * 0.12 + globalDrift * 0.18 + cinematicPush * 0.18;
    this.tmpPosition.y += verticalLift + beatWave * 0.1;
    this.tmpPosition.z += Math.cos(this.scroll.progress * Math.PI * 2.0) * 0.24 - beatWave * 0.18;

    this.tmpLookAt.x += velocityNudge * 0.045;
    this.tmpLookAt.y += Math.sin(t * 0.25 + this.scroll.progress * 2.4) * 0.08 + beatWave * 0.06;

    this.camera.position.lerp(this.tmpPosition, 0.06);
    this.lookTarget.lerp(this.tmpLookAt, 0.08);
    this.camera.lookAt(this.lookTarget);
  }

  _tick() {
    const t = this.clock.getElapsedTime();

    Object.entries(this.sceneStates).forEach(([key, state]) => {
      state.intensity = lerp(state.intensity, state.targetIntensity, 0.085);
      state.progress = lerp(state.progress, state.targetProgress, 0.09);

      this.visuals[key].setState({
        intensity: state.intensity,
        progress: state.progress,
        dominant: key === this.dominantKey,
      });
      this.visuals[key].update(t, this.scroll, state);
    });

    this.scene.fog = this.sceneStates.boat.intensity > 0.04 ? this.visuals.boat.fog : null;
    this._updateCamera(t);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }
}
