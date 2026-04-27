// Gatsby's parties: drifting gold confetti, champagne sparkle, jazz dust.
// Particles swirl upward like ash from a hundred conversations.

import * as THREE from 'three';

export class GoldParticlesScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    const isMobile = window.innerWidth < 720;
    const COUNT = isMobile ? 800 : 2200;
    this.count = COUNT;

    const positions = new Float32Array(COUNT * 3);
    const seeds     = new Float32Array(COUNT);
    const sizes     = new Float32Array(COUNT);
    const tints     = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22 - 5;
      seeds[i] = Math.random() * Math.PI * 2;
      sizes[i] = Math.random() * 0.5 + 0.2;
      tints[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTint',    new THREE.BufferAttribute(tints, 1));

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
        attribute float aSize;
        attribute float aTint;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTint;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          // Drift upward & swirl
          p.y += mod(uTime * 0.8 + aSeed * 3.0, 22.0) - 4.0 - position.y;
          p.x += sin(uTime * 0.6 + aSeed) * 0.6;
          p.z += cos(uTime * 0.5 + aSeed * 1.3) * 0.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * 90.0 * uPixelRatio / -mv.z;
          vTint = aTint;
          // Fade in/out near top & bottom
          float yNorm = (p.y + 4.0) / 22.0;
          vAlpha = smoothstep(0.0, 0.15, yNorm) * (1.0 - smoothstep(0.75, 1.0, yNorm));
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying float vTint;
        varying float vAlpha;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          // Mix between bright gold and warm cream
          vec3 gold  = vec3(0.94, 0.78, 0.32);
          vec3 cream = vec3(1.0, 0.93, 0.78);
          vec3 col = mix(gold, cream, vTint);
          gl_FragColor = vec4(col, t.a * vAlpha * 0.95);
        }
      `,
    });

    this.points = new THREE.Points(geo, mat);

    // --- A few "lantern" larger floating orbs (paper lanterns) ---
    this.lanterns = new THREE.Group();
    const lanternMat = new THREE.MeshBasicMaterial({
      color: 0xf0cf65,
      transparent: true,
      opacity: 0.85,
    });
    const lanternGlow = this._sparkleTexture();
    for (let i = 0; i < 8; i++) {
      const lg = new THREE.SphereGeometry(0.18, 16, 16);
      const lm = lanternMat.clone();
      const l = new THREE.Mesh(lg, lm);
      l.position.set(
        (Math.random() - 0.5) * 22,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 12 - 6,
      );
      l.userData.seed = Math.random() * Math.PI * 2;
      l.userData.baseY = l.position.y;
      this.lanterns.add(l);

      // Halo sprite
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lanternGlow,
        color: 0xf0cf65,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      halo.scale.setScalar(2.4);
      halo.position.copy(l.position);
      l.userData.halo = halo;
      this.lanterns.add(halo);
    }

    this.group.add(this.points, this.lanterns);
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
    grad.addColorStop(0.25, 'rgba(255,220,140,0.9)');
    grad.addColorStop(0.6,  'rgba(212,175,55,0.25)');
    grad.addColorStop(1,    'rgba(212,175,55,0)');
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

    this.lanterns.children.forEach(l => {
      if (!l.userData.seed) return;
      l.position.y = l.userData.baseY + Math.sin(t * 0.6 + l.userData.seed) * 0.4;
      if (l.userData.halo) l.userData.halo.position.y = l.position.y;
    });
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
