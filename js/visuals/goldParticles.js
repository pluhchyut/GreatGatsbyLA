// Gatsby's parties: confetti, champagne dust, and floating lantern light.
// The motion here should feel seductive but slightly unreal, like a memory
// polishing itself while strangers pass through it.

import * as THREE from 'three';

export class GoldParticlesScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    const isMobile = window.innerWidth < 720;
    const count = isMobile ? 800 : 2200;
    const dustCount = isMobile ? 180 : 420;

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const tints = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 16 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 6;
      seeds[i] = Math.random() * Math.PI * 2;
      sizes[i] = Math.random() * 0.55 + 0.18;
      tints[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));

    const sparkleTex = this._sparkleTexture();
    this.uniforms = {
      uTime: { value: 0 },
      uTex: { value: sparkleTex },
      uOpacity: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    this.pointsMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader: `
        attribute float aSeed;
        attribute float aSize;
        attribute float aTint;
        uniform float uTime;
        uniform float uProgress;
        uniform float uPixelRatio;
        varying float vTint;
        varying float vAlpha;
        void main() {
          float life = fract(uTime * 0.065 + aSeed * 0.17 + aTint * 0.23 + uProgress * 0.18);
          vec3 p = position;
          float swirl = life * 6.28318 + aSeed * 2.0;
          p.y = mix(-5.5, 15.0, life);
          p.x += sin(swirl + uTime * 0.3) * (0.4 + aTint * 0.75);
          p.z += cos(swirl * 1.2 + uTime * 0.25) * (0.35 + (1.0 - aTint) * 0.65);
          p.x += sin(uTime * 0.45 + aSeed * 3.0) * 0.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * (82.0 + (1.0 - life) * 46.0) * uPixelRatio / -mv.z;
          vTint = aTint;
          vAlpha = smoothstep(0.03, 0.16, life) * (1.0 - smoothstep(0.78, 1.0, life));
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying float vTint;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          vec3 gold = vec3(0.94, 0.79, 0.35);
          vec3 cream = vec3(1.0, 0.94, 0.80);
          vec3 amber = vec3(0.98, 0.70, 0.28);
          vec3 col = mix(gold, cream, vTint);
          col = mix(col, amber, smoothstep(0.7, 1.0, vTint) * 0.2);
          gl_FragColor = vec4(col, tex.a * vAlpha * uOpacity);
        }
      `,
    });
    this.points = new THREE.Points(geo, this.pointsMat);

    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 42;
      dustPositions[i * 3 + 1] = Math.random() * 18 - 4;
      dustPositions[i * 3 + 2] = -2 - Math.random() * 18;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: 0xf8e3a8,
      size: 0.08,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dust = new THREE.Points(dustGeo, this.dustMat);

    this.bloomMat = new THREE.SpriteMaterial({
      map: sparkleTex,
      color: 0xf0cf65,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.bloom = new THREE.Sprite(this.bloomMat);
    this.bloom.position.set(0, 3.2, -9);
    this.bloom.scale.set(16, 12, 1);

    this.warmLight = new THREE.PointLight(0xf0cf65, 0, 28, 1.6);
    this.warmLight.position.set(0, 4.0, -8);

    this.lanterns = new THREE.Group();
    const lanternGlow = this._sparkleTexture();
    this.lanternData = [];
    for (let i = 0; i < 10; i += 1) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xffe4a8 : 0xf0cf65,
        transparent: true,
        opacity: 0,
      });
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), mat);
      lantern.position.set(
        (Math.random() - 0.5) * 22,
        Math.random() * 8 + 1.6,
        (Math.random() - 0.5) * 12 - 8,
      );
      lantern.userData.base = lantern.position.clone();
      lantern.userData.seed = Math.random() * Math.PI * 2;
      lantern.userData.orbit = 0.35 + Math.random() * 0.45;

      const haloMat = new THREE.SpriteMaterial({
        map: lanternGlow,
        color: 0xf0cf65,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.setScalar(2.6 + Math.random() * 0.8);
      halo.position.copy(lantern.position);

      lantern.userData.halo = halo;
      this.lanternData.push({ lantern, halo, mat, haloMat });
      this.lanterns.add(lantern, halo);
    }

    this.group.position.set(0, 0.4, -2.8);
    this.group.add(this.points, this.dust, this.bloom, this.warmLight, this.lanterns);
    this.group.visible = false;
    scene.add(this.group);
  }

  _sparkleTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(255,235,170,0.95)');
    grad.addColorStop(0.58, 'rgba(212,175,55,0.28)');
    grad.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  setState({ intensity = 0, progress = 0 } = {}) {
    this.intensity = intensity;
    this.progress = progress;
    this.group.visible = intensity > 0.002;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t) {
    if (!this.group.visible) return;

    this.uniforms.uTime.value = t;
    this.uniforms.uOpacity.value = this.intensity;
    this.uniforms.uProgress.value = this.progress;

    this.dustMat.opacity = this.intensity * 0.24;
    this.bloomMat.opacity = this.intensity * (0.08 + this.progress * 0.18);
    this.warmLight.intensity = this.intensity * (1.0 + this.progress * 0.9);

    this.points.rotation.y = t * 0.03;
    this.dust.rotation.y = -t * 0.015;
    this.group.rotation.z = Math.sin(t * 0.18) * 0.03;

    this.lanternData.forEach(({ lantern, halo, mat, haloMat }) => {
      const seed = lantern.userData.seed;
      const orbit = lantern.userData.orbit;
      lantern.position.x = lantern.userData.base.x + Math.cos(t * 0.45 + seed) * orbit;
      lantern.position.y = lantern.userData.base.y + Math.sin(t * 0.7 + seed) * 0.42;
      lantern.position.z = lantern.userData.base.z + Math.sin(t * 0.3 + seed * 1.7) * 0.55;
      halo.position.copy(lantern.position);

      mat.opacity = this.intensity * 0.82;
      haloMat.opacity = this.intensity * 0.42;
      lantern.scale.setScalar(0.92 + Math.sin(t * 1.15 + seed) * 0.06);
    });
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
