// The illusion shatters. Particles spiral inward toward a vanishing point —
// the green light always receding, year by year, just out of reach.
// Color drifts from gold to green to red as the dream gives way to violence.

import * as THREE from 'three';

export class VortexScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    const isMobile = window.innerWidth < 720;
    const COUNT = isMobile ? 1500 : 4000;
    this.count = COUNT;

    const positions = new Float32Array(COUNT * 3);
    const seeds     = new Float32Array(COUNT);
    const radii     = new Float32Array(COUNT);
    const angles    = new Float32Array(COUNT);
    const colors    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 8 + 0.4;
      const a = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 16;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r;
      positions[i * 3 + 2] = z;
      seeds[i]  = Math.random();
      radii[i]  = r;
      angles[i] = a;

      // Color: weighted toward gold/green, with rare red sparks
      const roll = Math.random();
      if (roll < 0.55) {
        // gold
        colors[i*3+0] = 0.94; colors[i*3+1] = 0.78; colors[i*3+2] = 0.32;
      } else if (roll < 0.92) {
        // green
        colors[i*3+0] = 0.30; colors[i*3+1] = 0.92; colors[i*3+2] = 0.65;
      } else {
        // red embers
        colors[i*3+0] = 0.95; colors[i*3+1] = 0.25; colors[i*3+2] = 0.20;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aRadius',  new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aAngle',   new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));

    const tex = this._sparkleTexture();
    this.uniforms = {
      uTime: { value: 0 },
      uTex:  { value: tex },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader: `
        attribute float aSeed;
        attribute float aRadius;
        attribute float aAngle;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vCol;
        varying float vAlpha;
        void main() {
          // Spiral inward then loop back outward
          float life = mod(uTime * 0.18 + aSeed, 1.0);
          float r = mix(aRadius, 0.05, life);
          float a = aAngle + life * 6.0; // swirl
          vec3 p;
          p.x = cos(a) * r;
          p.y = sin(a) * r;
          p.z = position.z * (1.0 - life * 0.7);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.5 + 4.0 * (1.0 - life)) * 60.0 * uPixelRatio / -mv.z;
          vCol = aColor;
          // Fade in fast, fade out as they reach center
          vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.85, 1.0, life));
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec3 vCol;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vCol, t.a * vAlpha);
        }
      `,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.position.set(0, 1.5, -5);

    // Central singularity — a small fading green core
    const coreGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x4dffaa });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.core.position.set(0, 1.5, -5);

    const haloTex = this._sparkleTexture();
    this.coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.coreHalo.scale.setScalar(3.5);
    this.coreHalo.position.copy(this.core.position);

    this.group.add(this.points, this.coreHalo, this.core);
    this.group.visible = false;
    scene.add(this.group);
  }

  _sparkleTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.3,  'rgba(255,255,255,0.6)');
    grad.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t) {
    if (!this.group.visible) return;
    this.uniforms.uTime.value = t;
    this.points.rotation.z = t * 0.05;
    const pulse = 0.85 + Math.sin(t * 2.0) * 0.15;
    this.core.scale.setScalar(pulse);
    this.coreHalo.scale.setScalar(3.5 * pulse);
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
