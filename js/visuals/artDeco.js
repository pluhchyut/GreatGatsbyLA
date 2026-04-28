// Daisy is treated as a half-remembered presence: warm light, soft veils,
// drifting bokeh, and a profile that never quite resolves into certainty.

import * as THREE from 'three';

export class ArtDecoScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    this.ambient = new THREE.AmbientLight(0x203244, 0);
    this.keyLight = new THREE.DirectionalLight(0xffefc8, 0);
    this.keyLight.position.set(4, 5, 7);
    this.rimLight = new THREE.DirectionalLight(0xf0cf65, 0);
    this.rimLight.position.set(-4, 2, -4);
    this.coolFill = new THREE.DirectionalLight(0x4dffaa, 0);
    this.coolFill.position.set(-6, 1, 5);

    this.backGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(244,233,216,0.95)', 'rgba(244,233,216,0)'),
      color: 0xb99136,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.backGlow = new THREE.Sprite(this.backGlowMat);
    this.backGlow.position.set(0.2, 1.65, -9.4);
    this.backGlow.scale.set(16, 16, 1);

    this.coldHaloMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(77,255,170,0.75)', 'rgba(77,255,170,0)'),
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coldHalo = new THREE.Sprite(this.coldHaloMat);
    this.coldHalo.position.set(-0.7, 1.45, -8.7);
    this.coldHalo.scale.set(6.4, 6.4, 1);

    this.memory = new THREE.Group();
    this.memory.position.set(0, 1.35, -6.2);

    this.profileMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4e9d8,
      transparent: true,
      opacity: 0,
      roughness: 0.32,
      metalness: 0.02,
      transmission: 0.16,
      thickness: 0.32,
      emissive: 0x5a3e10,
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });

    const profileGeo = new THREE.SphereGeometry(
      1.28,
      54,
      54,
      Math.PI * 0.17,
      Math.PI * 1.04,
      Math.PI * 0.18,
      Math.PI * 0.74,
    );
    this.profile = new THREE.Mesh(profileGeo, this.profileMat);
    this.profile.position.set(0.38, -0.04, 0.08);
    this.profile.rotation.y = -0.92;
    this.profile.rotation.z = 0.08;
    this.profile.scale.set(0.68, 1.12, 0.46);

    this.cheekGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(255,242,212,0.85)', 'rgba(255,242,212,0)'),
      color: 0xf0cf65,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.cheekGlow = new THREE.Sprite(this.cheekGlowMat);
    this.cheekGlow.position.set(0.38, 0.22, 0.95);
    this.cheekGlow.scale.set(1.8, 1.8, 1);
    this.profile.add(this.cheekGlow);

    this.eyeGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(77,255,170,0.98)', 'rgba(77,255,170,0)'),
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.eyeGlow = new THREE.Sprite(this.eyeGlowMat);
    this.eyeGlow.position.set(0.48, 0.35, 1.04);
    this.eyeGlow.scale.set(0.48, 0.48, 1);
    this.profile.add(this.eyeGlow);

    this.veils = new THREE.Group();
    this.veilMaterials = [];
    for (let i = 0; i < 4; i += 1) {
      const veilGeo = new THREE.PlaneGeometry(2.2 + i * 0.25, 3.8 + i * 0.4, 20, 28);
      const pos = veilGeo.attributes.position;
      for (let j = 0; j < pos.count; j += 1) {
        const x = pos.getX(j);
        const y = pos.getY(j);
        pos.setZ(j, Math.sin(y * 1.6 + i * 0.8) * 0.12 + Math.cos(x * 1.2) * 0.08);
      }
      pos.needsUpdate = true;
      veilGeo.computeVertexNormals();

      const veilMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf4e9d8 : 0xd4af37,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      this.veilMaterials.push(veilMat);

      const veil = new THREE.Mesh(veilGeo, veilMat);
      veil.position.set(
        -0.45 + i * 0.26,
        0.18 - i * 0.05,
        -0.65 - i * 0.55,
      );
      veil.rotation.y = -0.45 + i * 0.16;
      veil.rotation.z = -0.1 + i * 0.06;
      veil.userData.seed = Math.random() * Math.PI * 2;
      veil.userData.basePosition = veil.position.clone();
      veil.userData.baseRotation = veil.rotation.clone();
      this.veils.add(veil);
    }

    this.memoryRings = new THREE.Group();
    this.ringMaterials = [];
    [1.3, 1.95, 2.7].forEach((radius, index) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xf0cf65 : 0xf4e9d8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.02 + index * 0.012, 16, 120, Math.PI * 1.18),
        ringMat,
      );
      ring.rotation.set(0.14 - index * 0.08, 0.72 + index * 0.08, 0.28 - index * 0.12);
      ring.position.set(0.7 - index * 0.18, 0.12 + index * 0.12, -0.9 - index * 0.38);
      ring.userData.seed = Math.random() * Math.PI * 2;
      this.ringMaterials.push(ringMat);
      this.memoryRings.add(ring);
    });

    this.bokeh = new THREE.Group();
    for (let i = 0; i < 10; i += 1) {
      const bokehMat = new THREE.SpriteMaterial({
        map: this._radialTex('rgba(255,248,230,0.9)', 'rgba(255,248,230,0)'),
        color: i % 3 === 0 ? 0xf0cf65 : 0xf4e9d8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(bokehMat);
      sprite.position.set(
        (Math.random() - 0.5) * 9,
        0.4 + Math.random() * 4.6,
        -3.5 - Math.random() * 7.5,
      );
      const scale = 0.45 + Math.random() * 1.1;
      sprite.scale.set(scale, scale, 1);
      sprite.userData.seed = Math.random() * Math.PI * 2;
      sprite.userData.basePosition = sprite.position.clone();
      this.bokeh.add(sprite);
    }

    this.dust = this._makeDust();

    this.memory.add(this.profile, this.veils, this.memoryRings);
    this.group.add(
      this.ambient,
      this.keyLight,
      this.rimLight,
      this.coolFill,
      this.backGlow,
      this.coldHalo,
      this.bokeh,
      this.memory,
      this.dust,
    );
    this.group.visible = false;
    scene.add(this.group);
  }

  _radialTex(c0, c1) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _makeDust() {
    const count = window.innerWidth < 720 ? 110 : 240;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 4.8 - 0.2;
      positions[i * 3 + 2] = -Math.random() * 8 - 2;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const tex = this._radialTex('rgba(255,250,240,1)', 'rgba(255,250,240,0)');
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTex: { value: tex },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.28 + aSeed * 8.0) * 0.24;
          p.y += cos(uTime * 0.34 + aSeed * 9.0) * 0.14;
          p.z += sin(uTime * 0.18 + aSeed * 10.0) * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (3.5 + aSeed * 5.5) * 24.0 * uPixelRatio / -mv.z;
          vAlpha = 0.35 + aSeed * 0.65;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(0.96, 0.92, 0.84, tex.a * vAlpha * uOpacity);
        }
      `,
    });
    this.dustUniforms = mat.uniforms;
    return new THREE.Points(geo, mat);
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

    const warmShift = 0.56 + this.progress * 0.44;
    const coolShift = 1.0 - smoothstepLocal(0.18, 0.94, this.progress) * 0.72;

    this.ambient.intensity = this.intensity * 0.45;
    this.keyLight.intensity = this.intensity * (1.3 + this.progress * 0.38);
    this.rimLight.intensity = this.intensity * 0.72;
    this.coolFill.intensity = this.intensity * 0.22 * coolShift;

    this.profileMat.opacity = this.intensity * 0.8;
    this.profileMat.emissiveIntensity = this.intensity * 0.12 * warmShift;
    this.backGlowMat.opacity = this.intensity * (0.18 + this.progress * 0.22);
    this.coldHaloMat.opacity = this.intensity * (0.1 + (1 - this.progress) * 0.18);
    this.cheekGlowMat.opacity = this.intensity * (0.22 + this.progress * 0.18);
    this.eyeGlowMat.opacity = this.intensity * (0.16 + Math.sin(t * 1.4) * 0.05 + (1 - this.progress) * 0.08);

    this.memory.rotation.y = Math.sin(t * 0.18) * 0.08 - this.progress * 0.06;
    this.memory.rotation.z = Math.sin(t * 0.14) * 0.025;
    this.memory.position.x = Math.sin(t * 0.16) * 0.18;
    this.memory.position.z = -6.2 + Math.sin(t * 0.2) * 0.12;
    this.profile.rotation.y = -0.92 + Math.sin(t * 0.24) * 0.06 + this.progress * 0.08;
    this.profile.rotation.z = 0.1 + Math.sin(t * 0.42) * 0.02;

    this.veils.children.forEach((veil, index) => {
      const basePos = veil.userData.basePosition;
      const baseRot = veil.userData.baseRotation;
      const sway = Math.sin(t * (0.55 + index * 0.08) + veil.userData.seed);
      veil.position.x = basePos.x + sway * 0.08;
      veil.position.y = basePos.y + Math.cos(t * 0.48 + veil.userData.seed) * 0.06;
      veil.position.z = basePos.z + Math.sin(t * 0.38 + veil.userData.seed) * 0.12;
      veil.rotation.y = baseRot.y + sway * 0.1;
      veil.rotation.z = baseRot.z + Math.cos(t * 0.44 + veil.userData.seed) * 0.035;
      this.veilMaterials[index].opacity = this.intensity * (0.05 + (3 - index) * 0.025 + this.progress * 0.05);
    });

    this.memoryRings.children.forEach((ring, index) => {
      ring.rotation.z += 0.0008 + index * 0.00015;
      ring.rotation.y += 0.0005 + index * 0.0001;
      ring.position.x = 0.2 - index * 0.08 + Math.sin(t * 0.22 + ring.userData.seed) * 0.06;
      this.ringMaterials[index].opacity = this.intensity * (0.05 + index * 0.022);
    });

    this.bokeh.children.forEach((sprite, index) => {
      const base = sprite.userData.basePosition;
      sprite.position.x = base.x + Math.sin(t * (0.24 + index * 0.01) + sprite.userData.seed) * 0.22;
      sprite.position.y = base.y + Math.cos(t * 0.26 + sprite.userData.seed) * 0.18;
      sprite.position.z = base.z + Math.sin(t * 0.16 + sprite.userData.seed) * 0.22;
      sprite.material.opacity = this.intensity * (0.08 + (index % 4) * 0.03 + this.progress * 0.03);
    });

    this.dustUniforms.uTime.value = t;
    this.dustUniforms.uOpacity.value = this.intensity * (0.36 + this.progress * 0.12);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) {
          o.material.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      }
    });
    this.scene.remove(this.group);
  }
}

function smoothstepLocal(min, max, value) {
  const x = THREE.MathUtils.clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
}
