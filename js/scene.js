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

function smoothstep(min, max, value) {
  const x = THREE.MathUtils.clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
}

function hashString(value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createBeatVariant(beat) {
  const hash = hashString(`${beat.entryId}|${beat.scene}|${beat.shot}|${beat.transition}`);
  const byte = (shift) => ((hash >>> shift) & 255) / 255;
  const signed = (shift, scale) => (byte(shift) - 0.5) * scale;
  return {
    sideBias: signed(0, 0.64),
    verticalBias: signed(8, 0.34),
    depthBias: signed(16, 0.46),
    rollBias: signed(24, 0.04),
    driftBias: 0.82 + byte(4) * 0.58,
    overlayX: 22 + byte(12) * 56,
    overlayY: 18 + byte(20) * 48,
    overlayRadius: 52 + byte(2) * 18,
    overlayAngle: 150 + byte(10) * 80,
    transitionPunch: 0.84 + byte(18) * 0.5,
  };
}

function parseShotText(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('light lingering last')) return 'telephoto';
  if (lower.includes('green light steady in darkness')) return 'telephoto';
  if (lower.includes('green light glowing alone')) return 'telephoto';
  if (lower.includes('zoom nearly')) return 'push';
  if (lower.includes('tight close-up')) return 'close';
  if (lower.includes('extreme close-up')) return 'extreme-close';
  if (lower.includes('close-up')) return 'close';
  if (lower.includes('wide shot')) return 'wide';
  if (lower.includes('long shot')) return 'long';
  if (lower.includes('crane shot')) return 'crane';
  if (lower.includes('tracking shot')) return 'tracking';
  if (lower.includes('over-the-shoulder')) return 'overshoulder';
  if (lower.includes('telephoto')) return 'telephoto';
  if (lower.includes('slow push-in')) return 'push';
  if (lower.includes('still frame')) return 'still';
  if (lower.includes('static shot')) return 'static';
  if (lower.includes('time-lapse')) return 'timelapse';
  if (lower.includes('montage')) return 'montage';
  if (lower.includes('full fade to black')) return 'still';
  if (lower.includes('compressed')) return 'telephoto';
  return 'medium';
}

function parseTransitionText(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('bleeds upward')) return 'bleed-up';
  if (lower.includes('tilts down into')) return 'tilt-drop';
  if (lower.includes('warm golden light') || lower.includes('pale glow of mansion lights')) return 'glow-dissolve';
  if (lower.includes('layered dissolve') || lower.includes('overlap')) return 'layered-dissolve';
  if (lower.includes('droplet falls') || lower.includes('drop hits the water')) return 'impact-drop';
  if (lower.includes('heartbeat')) return 'heartbeat';
  if (lower.includes('motion streaks') || lower.includes('streaks of color')) return 'streak-blur';
  if (lower.includes('warps into') || lower.includes('distorts')) return 'audio-warp';
  if (lower.includes('slower, heavier') || lower.includes('spin slows')) return 'decelerate';
  if (lower.includes('flicker') || lower.includes('pulses once')) return 'flicker';
  if (lower.includes('horizon line bends')) return 'horizon-bend';
  if (lower.includes('glitch')) return 'frame-glitch';
  if (lower.includes('fade to black') || lower.includes('empties without ever quite closing')) return 'fade-out';
  if (lower.includes('dissolves into air') || lower.includes('empty air') || lower.includes('dissolves into wind')) return 'air-drift';
  if (lower.includes('dissolve')) return 'dissolve';
  if (lower.includes('fade')) return 'fade';
  if (lower.includes('blur')) return 'blur';
  if (lower.includes('warp')) return 'warp';
  if (lower.includes('glitch')) return 'glitch';
  if (lower.includes('silence')) return 'silence';
  if (lower.includes('pulse')) return 'pulse';
  if (lower.includes('ripples')) return 'ripple';
  if (lower.includes('stretch')) return 'stretch';
  if (lower.includes('falls') || lower.includes('drop')) return 'drop';
  if (lower.includes('tilt')) return 'tilt';
  if (lower.includes('echo')) return 'echo';
  return 'drift';
}

const SHOT_PROFILES = {
  wide: { fov: 54, distance: 1.45, height: 0.45, side: 0.0, drift: 0.12, lookLift: 0.0, roll: 0.0 },
  long: { fov: 50, distance: 1.8, height: 0.15, side: 0.18, drift: 0.08, lookLift: -0.04, roll: 0.0 },
  medium: { fov: 46, distance: 0.6, height: 0.0, side: 0.0, drift: 0.12, lookLift: 0.0, roll: 0.0 },
  close: { fov: 34, distance: -0.95, height: -0.16, side: 0.22, drift: 0.05, lookLift: 0.05, roll: 0.01 },
  'extreme-close': { fov: 26, distance: -1.8, height: -0.28, side: 0.1, drift: 0.025, lookLift: 0.12, roll: 0.015 },
  crane: { fov: 42, distance: 1.2, height: 1.8, side: 0.15, drift: 0.07, lookLift: -0.18, roll: -0.015 },
  tracking: { fov: 44, distance: 0.25, height: 0.08, side: 0.85, drift: 0.26, lookLift: 0.02, roll: 0.01 },
  overshoulder: { fov: 38, distance: 0.1, height: 0.12, side: 1.15, drift: 0.05, lookLift: -0.03, roll: 0.008 },
  telephoto: { fov: 24, distance: 2.7, height: 0.0, side: 0.08, drift: 0.02, lookLift: 0.0, roll: 0.0 },
  push: { fov: 34, distance: 0.1, height: -0.06, side: 0.0, drift: 0.04, lookLift: 0.05, roll: 0.0 },
  static: { fov: 40, distance: 0.45, height: 0.0, side: 0.0, drift: 0.0, lookLift: 0.0, roll: 0.0 },
  still: { fov: 32, distance: 0.8, height: 0.0, side: 0.0, drift: 0.0, lookLift: 0.0, roll: 0.0 },
  timelapse: { fov: 48, distance: 1.2, height: 0.25, side: 0.35, drift: 0.42, lookLift: -0.04, roll: 0.012 },
  montage: { fov: 36, distance: 0.0, height: 0.08, side: 0.45, drift: 0.32, lookLift: 0.03, roll: 0.018 },
};

const TRANSITION_STYLES = {
  'bleed-up': { opacity: 0.2, blur: 2.8, tint: 'rgba(77,255,170,0.12)', radius: 64, angle: 180 },
  'tilt-drop': { opacity: 0.16, blur: 1.8, tint: 'rgba(244,233,216,0.1)', radius: 56, angle: 172 },
  'glow-dissolve': { opacity: 0.22, blur: 3.1, tint: 'rgba(240,207,101,0.18)', radius: 60, angle: 146 },
  'layered-dissolve': { opacity: 0.18, blur: 3.4, tint: 'rgba(244,233,216,0.14)', radius: 58, angle: 130 },
  'impact-drop': { opacity: 0.16, blur: 2.1, tint: 'rgba(212,175,55,0.12)', radius: 54, angle: 170 },
  heartbeat: { opacity: 0.22, blur: 2.4, tint: 'rgba(77,255,170,0.18)', radius: 48, angle: 180 },
  'streak-blur': { opacity: 0.16, blur: 4.5, tint: 'rgba(244,233,216,0.08)', radius: 62, angle: 112 },
  'audio-warp': { opacity: 0.14, blur: 3.3, tint: 'rgba(77,255,170,0.11)', radius: 54, angle: 104 },
  decelerate: { opacity: 0.16, blur: 1.3, tint: 'rgba(244,233,216,0.12)', radius: 50, angle: 180 },
  flicker: { opacity: 0.14, blur: 2.0, tint: 'rgba(77,255,170,0.14)', radius: 48, angle: 180 },
  'horizon-bend': { opacity: 0.18, blur: 2.0, tint: 'rgba(77,255,170,0.08)', radius: 68, angle: 180 },
  'frame-glitch': { opacity: 0.12, blur: 1.0, tint: 'rgba(212,175,55,0.1)', radius: 44, angle: 90 },
  'fade-out': { opacity: 0.3, blur: 1.2, tint: 'rgba(3,7,13,0.36)', radius: 76, angle: 180 },
  'air-drift': { opacity: 0.12, blur: 2.0, tint: 'rgba(244,233,216,0.08)', radius: 60, angle: 138 },
  dissolve: { opacity: 0.18, blur: 2.8, tint: 'rgba(244,233,216,0.16)', radius: 56, angle: 150 },
  fade: { opacity: 0.28, blur: 1.5, tint: 'rgba(10,25,41,0.32)', radius: 72, angle: 180 },
  blur: { opacity: 0.16, blur: 4.2, tint: 'rgba(244,233,216,0.08)', radius: 56, angle: 120 },
  warp: { opacity: 0.14, blur: 2.6, tint: 'rgba(77,255,170,0.14)', radius: 54, angle: 106 },
  glitch: { opacity: 0.1, blur: 1.4, tint: 'rgba(212,175,55,0.12)', radius: 46, angle: 90 },
  silence: { opacity: 0.22, blur: 0.6, tint: 'rgba(3,7,13,0.28)', radius: 72, angle: 180 },
  pulse: { opacity: 0.2, blur: 2.0, tint: 'rgba(77,255,170,0.16)', radius: 48, angle: 180 },
  ripple: { opacity: 0.12, blur: 2.2, tint: 'rgba(77,255,170,0.1)', radius: 60, angle: 180 },
  stretch: { opacity: 0.16, blur: 2.4, tint: 'rgba(244,233,216,0.1)', radius: 64, angle: 180 },
  drop: { opacity: 0.14, blur: 2.0, tint: 'rgba(212,175,55,0.1)', radius: 54, angle: 170 },
  tilt: { opacity: 0.08, blur: 1.4, tint: 'rgba(244,233,216,0.08)', radius: 50, angle: 156 },
  echo: { opacity: 0.12, blur: 2.4, tint: 'rgba(77,255,170,0.08)', radius: 58, angle: 120 },
  drift: { opacity: 0.08, blur: 1.2, tint: 'rgba(244,233,216,0.06)', radius: 52, angle: 148 },
};

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
    this.tmpEuler = new THREE.Euler();
    this.baseQuaternion = new THREE.Quaternion();
    this.targetQuaternion = new THREE.Quaternion();
    this.renderer.domElement.style.transformOrigin = 'center center';
    this.targetFov = this.camera.fov;

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
    this.veilEl = document.getElementById('transition-veil');
    this.maskTopEl = document.getElementById('frame-mask-top');
    this.maskBottomEl = document.getElementById('frame-mask-bottom');
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

  _getShotProfile() {
    const shotType = parseShotText(this.activeBeat.shot);
    const transitionType = parseTransitionText(this.activeBeat.transition);
    const shot = SHOT_PROFILES[shotType] || SHOT_PROFILES.medium;
    const transition = TRANSITION_STYLES[transitionType] || TRANSITION_STYLES.drift;
    const variant = createBeatVariant(this.activeBeat);
    return { shotType, transitionType, shot, transition, variant };
  }

  _getSceneFocusOffset(sceneKey, shotType) {
    const map = {
      greenLight: {
        wide: { pos: new THREE.Vector3(0, 0.3, 0.8), look: new THREE.Vector3(0, -0.1, -1.6) },
        close: { pos: new THREE.Vector3(0, 0.0, -0.95), look: new THREE.Vector3(0, 0.3, -4.4) },
        'extreme-close': { pos: new THREE.Vector3(0.1, 0.0, -1.4), look: new THREE.Vector3(0.0, 0.45, -4.0) },
        overshoulder: { pos: new THREE.Vector3(0.9, 0.15, 0.1), look: new THREE.Vector3(-0.35, 0.1, -2.8) },
        telephoto: { pos: new THREE.Vector3(0, 0.12, 1.5), look: new THREE.Vector3(0, 0.0, -3.6) },
      },
      goldParticles: {
        close: { pos: new THREE.Vector3(0.25, -0.15, -0.8), look: new THREE.Vector3(0.15, -0.15, -2.0) },
        tracking: { pos: new THREE.Vector3(0.55, 0.0, -0.1), look: new THREE.Vector3(0.0, 0.0, -1.4) },
        montage: { pos: new THREE.Vector3(0.35, 0.08, -0.5), look: new THREE.Vector3(0, 0.1, -1.8) },
      },
      mansion: {
        crane: { pos: new THREE.Vector3(0, 0.9, 1.1), look: new THREE.Vector3(0, -0.2, -1.2) },
        static: { pos: new THREE.Vector3(0, -0.1, -0.1), look: new THREE.Vector3(0, 0.0, -1.2) },
        wide: { pos: new THREE.Vector3(0, 0.2, 0.8), look: new THREE.Vector3(0, 0.0, -0.6) },
      },
      artDeco: {
        close: { pos: new THREE.Vector3(0.0, -0.05, -1.1), look: new THREE.Vector3(0, 0.1, -1.5) },
        'extreme-close': { pos: new THREE.Vector3(0.0, 0.0, -1.7), look: new THREE.Vector3(0, 0.12, -1.3) },
        push: { pos: new THREE.Vector3(0, 0.0, -0.6), look: new THREE.Vector3(0, 0.1, -1.4) },
      },
      vortex: {
        static: { pos: new THREE.Vector3(0, 0.0, 0.2), look: new THREE.Vector3(0, 0.0, -0.6) },
        timelapse: { pos: new THREE.Vector3(0.4, 0.15, 0.5), look: new THREE.Vector3(0, 0.0, -0.9) },
        blur: { pos: new THREE.Vector3(0.0, 0.0, -0.1), look: new THREE.Vector3(0, 0.0, -0.8) },
      },
      boat: {
        long: { pos: new THREE.Vector3(0.3, 0.25, 1.3), look: new THREE.Vector3(-0.2, 0.0, -1.5) },
        wide: { pos: new THREE.Vector3(0.0, 0.3, 1.8), look: new THREE.Vector3(-0.4, 0.0, -1.8) },
        telephoto: { pos: new THREE.Vector3(-0.7, 0.14, 3.6), look: new THREE.Vector3(-3.0, 0.58, -16.8) },
        still: { pos: new THREE.Vector3(-0.95, 0.16, 4.0), look: new THREE.Vector3(-3.25, 0.64, -17.0) },
      },
    };
    return map[sceneKey]?.[shotType] || { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  }

  _applyBeatOverlay(progress, shotType, transitionStyle, variant) {
    if (!this.veilEl || !this.maskTopEl || !this.maskBottomEl) return;

    const veilPhase = smoothstep(0.45, 1.0, progress);
    const punch = variant.transitionPunch;
    const maskBase = shotType === 'telephoto' || shotType === 'wide'
      ? 0
      : shotType === 'extreme-close'
        ? 10
        : shotType === 'close' || shotType === 'push'
          ? 7
          : 4;
    const maskHeight = maskBase + veilPhase * (7 + punch * 3.5);
    const centerY = variant.overlayY - veilPhase * 10;
    const centerX = variant.overlayX + Math.sin(progress * Math.PI) * variant.sideBias * 18;
    const radius = transitionStyle.radius ?? 58;
    const angle = transitionStyle.angle ?? 160;

    this.maskTopEl.style.height = `${maskHeight}px`;
    this.maskBottomEl.style.height = `${maskHeight}px`;
    this.veilEl.style.opacity = String(transitionStyle.opacity * veilPhase * punch);
    this.veilEl.style.backdropFilter = `blur(${transitionStyle.blur * veilPhase * punch}px) saturate(${1 + veilPhase * 0.18})`;
    this.veilEl.style.background = `
      radial-gradient(circle at ${centerX}% ${centerY}%, ${transitionStyle.tint}, transparent ${radius}%),
      linear-gradient(${angle}deg, rgba(10, 25, 41, ${veilPhase * 0.12}), rgba(10, 25, 41, ${veilPhase * 0.24}))
    `;
  }

  _applyVisualRig(key, visual, shotType, progress, t, variant) {
    if (!visual.group) return;
    const group = visual.group;
    const base = group.userData.baseTransform || {
      position: group.position.clone(),
      rotation: group.rotation.clone(),
      scale: group.scale.clone(),
    };
    group.userData.baseTransform = base;

    const transitionPhase = smoothstep(0.45, 1.0, progress);
    const offsetScale = (this.sceneStates[key]?.intensity || 0) * 0.45;
    let x = 0;
    let y = 0;
    let z = 0;
    let ry = 0;
    let rz = 0;
    let scale = 1;

    if (shotType === 'tracking') {
      x += Math.sin(t * 0.55) * 0.28;
      z += Math.cos(t * 0.32) * 0.16;
    } else if (shotType === 'crane') {
      y += 0.55 - transitionPhase * 0.35;
      ry -= 0.08;
    } else if (shotType === 'close' || shotType === 'extreme-close') {
      scale += shotType === 'extreme-close' ? 0.18 : 0.1;
      z += transitionPhase * 0.18;
    } else if (shotType === 'telephoto') {
      scale += 0.06;
      x += Math.sin(t * 0.12) * 0.06;
    } else if (shotType === 'timelapse' || shotType === 'montage') {
      rz += Math.sin(t * 1.8) * 0.02;
      x += Math.cos(t * 1.4) * 0.12;
    } else if (shotType === 'still' || shotType === 'static') {
      x += 0;
    } else if (shotType === 'overshoulder') {
      x -= 0.18;
      ry += 0.06;
    }

    x += variant.sideBias * 0.12;
    y += variant.verticalBias * 0.12;
    z += variant.depthBias * 0.08;
    rz += variant.rollBias * 0.25;

    if (this.activeBeat.scene === key) {
      group.position.x = lerp(group.position.x, base.position.x + x * offsetScale, 0.08);
      group.position.y = lerp(group.position.y, base.position.y + y * offsetScale, 0.08);
      group.position.z = lerp(group.position.z, base.position.z + z * offsetScale, 0.08);
      group.rotation.y = lerp(group.rotation.y, base.rotation.y + ry * offsetScale, 0.08);
      group.rotation.z = lerp(group.rotation.z, base.rotation.z + rz * offsetScale, 0.08);
      group.scale.x = lerp(group.scale.x, base.scale.x * scale, 0.08);
      group.scale.y = lerp(group.scale.y, base.scale.y * scale, 0.08);
      group.scale.z = lerp(group.scale.z, base.scale.z * scale, 0.08);
    } else {
      group.position.lerp(base.position, 0.08);
      group.rotation.x = lerp(group.rotation.x, base.rotation.x, 0.08);
      group.rotation.y = lerp(group.rotation.y, base.rotation.y, 0.08);
      group.rotation.z = lerp(group.rotation.z, base.rotation.z, 0.08);
      group.scale.x = lerp(group.scale.x, base.scale.x, 0.08);
      group.scale.y = lerp(group.scale.y, base.scale.y, 0.08);
      group.scale.z = lerp(group.scale.z, base.scale.z, 0.08);
    }
  }

  _updateCamera(t) {
    const beatProgress = this.activeBeat.progress || 0;
    const { shotType, transitionType, shot, transition, variant } = this._getShotProfile();
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
    const beatWave = Math.sin(beatProgress * Math.PI);
    const transitionPhase = smoothstep(0.5, 1.0, beatProgress);
    const cinematicPush = beatProgress - 0.5;
    const sceneOffset = this._getSceneFocusOffset(this.activeBeat.scene, shotType);

    this.tmpPosition.x += velocityNudge * 0.12 + globalDrift * shot.drift * variant.driftBias + cinematicPush * 0.18 + shot.side + sceneOffset.pos.x + variant.sideBias * 0.46;
    this.tmpPosition.y += verticalLift + beatWave * 0.1 + shot.height + sceneOffset.pos.y + variant.verticalBias * 0.34;
    this.tmpPosition.z += Math.cos(this.scroll.progress * Math.PI * 2.0) * 0.24 + shot.distance - beatWave * 0.18 + sceneOffset.pos.z + variant.depthBias * 0.4;

    this.tmpLookAt.x += velocityNudge * 0.045 + sceneOffset.look.x + variant.sideBias * 0.16;
    this.tmpLookAt.y += Math.sin(t * 0.25 + this.scroll.progress * 2.4) * 0.08 + beatWave * 0.06 + shot.lookLift + sceneOffset.look.y + variant.verticalBias * 0.14;
    this.tmpLookAt.z += sceneOffset.look.z;

    if (shotType === 'push') {
      this.tmpPosition.z -= smoothstep(0.0, 1.0, beatProgress) * 0.8;
    }
    if (shotType === 'tracking') {
      this.tmpPosition.x += Math.sin(t * 0.75) * 0.25;
      this.tmpLookAt.x += Math.cos(t * 0.62) * 0.12;
    }
    if (shotType === 'timelapse') {
      this.tmpPosition.x += Math.sin(t * 3.2) * 0.12;
      this.tmpPosition.y += Math.cos(t * 2.8) * 0.06;
    }
    if (transitionType === 'tilt') {
      this.tmpLookAt.y -= transitionPhase * 0.28;
    }
    if (transitionType === 'drop') {
      this.tmpPosition.y -= transitionPhase * 0.22;
    }
    if (transitionType === 'stretch') {
      this.tmpPosition.z += transitionPhase * 0.35;
    }
    if (transitionType === 'bleed-up') {
      this.tmpPosition.y += transitionPhase * 0.22;
      this.tmpLookAt.y += transitionPhase * 0.18;
    }
    if (transitionType === 'glow-dissolve') {
      this.tmpPosition.z -= transitionPhase * 0.26;
      this.tmpLookAt.y += transitionPhase * 0.08;
    }
    if (transitionType === 'tilt-drop' || transitionType === 'impact-drop') {
      this.tmpPosition.y -= transitionPhase * 0.28;
      this.tmpLookAt.y -= transitionPhase * 0.2;
    }
    if (transitionType === 'streak-blur') {
      this.tmpPosition.x += Math.sin(t * 1.6 * variant.driftBias) * 0.24 * transitionPhase;
      this.tmpLookAt.x += Math.cos(t * 1.35 * variant.driftBias) * 0.12 * transitionPhase;
    }
    if (transitionType === 'layered-dissolve') {
      this.tmpPosition.x += variant.sideBias * transitionPhase * 0.42;
      this.tmpPosition.z += transitionPhase * 0.12;
    }
    if (transitionType === 'audio-warp') {
      this.tmpPosition.x += Math.sin(t * 2.3 * variant.driftBias) * 0.12 * transitionPhase;
      this.tmpPosition.y += Math.cos(t * 1.9 * variant.driftBias) * 0.06 * transitionPhase;
    }
    if (transitionType === 'heartbeat' || transitionType === 'flicker') {
      const pulse = Math.sin(t * (transitionType === 'heartbeat' ? 2.6 : 3.2)) * 0.05 * transitionPhase;
      this.tmpPosition.z += pulse;
    }
    if (transitionType === 'decelerate') {
      this.tmpPosition.z += transitionPhase * 0.12;
      this.tmpPosition.x *= 1 - transitionPhase * 0.08;
    }
    if (transitionType === 'frame-glitch') {
      this.tmpPosition.x += Math.sin(t * 7.0) * 0.03 * transitionPhase;
      this.tmpPosition.y += Math.cos(t * 5.2) * 0.02 * transitionPhase;
    }
    if (transitionType === 'horizon-bend') {
      this.tmpLookAt.x += variant.sideBias * 0.22 * transitionPhase;
      this.tmpLookAt.y -= transitionPhase * 0.05;
    }
    if (transitionType === 'fade-out') {
      this.tmpPosition.z += transitionPhase * 0.3;
      this.tmpLookAt.y -= transitionPhase * 0.04;
    }
    if (transitionType === 'air-drift') {
      this.tmpPosition.x += Math.sin(t * 0.9 + variant.sideBias * 4) * 0.08 * transitionPhase;
    }

    this.targetFov = lerp(this.targetFov, shot.fov, 0.08);
    this.camera.fov = lerp(this.camera.fov, this.targetFov, 0.12);
    this.camera.updateProjectionMatrix();
    this.camera.position.lerp(this.tmpPosition, 0.06);
    this.lookTarget.lerp(this.tmpLookAt, 0.08);
    this.camera.lookAt(this.lookTarget);
    this.baseQuaternion.copy(this.camera.quaternion);
    this.tmpEuler.set(0, 0, (shot.roll + variant.rollBias) * (1.0 - transitionPhase * 0.35));
    this.targetQuaternion.setFromEuler(this.tmpEuler);
    this.camera.quaternion.multiply(this.targetQuaternion);
    this.camera.quaternion.slerp(this.baseQuaternion, 0.88);
    this._applyBeatOverlay(beatProgress, shotType, transition, variant);
  }

  _tick() {
    const t = this.clock.getElapsedTime();
    const { shotType, variant } = this._getShotProfile();

    Object.entries(this.sceneStates).forEach(([key, state]) => {
      state.intensity = lerp(state.intensity, state.targetIntensity, 0.085);
      state.progress = lerp(state.progress, state.targetProgress, 0.09);

      this.visuals[key].setState({
        intensity: state.intensity,
        progress: state.progress,
        dominant: key === this.dominantKey,
      });
      this.visuals[key].update(t, this.scroll, state);
      this._applyVisualRig(key, this.visuals[key], shotType, this.activeBeat.progress || 0, t, variant);
    });

    this.scene.fog = this.sceneStates.boat.intensity > 0.04 ? this.visuals.boat.fog : null;
    this._updateCamera(t);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }
}
