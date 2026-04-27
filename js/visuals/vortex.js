// The illusion shatters. The spiral tightens as scroll progress advances
// through the chapter, so collapse feels authored rather than purely looped.

import * as THREE from 'three';

export class VortexScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    const isMobile = window.innerWidth < 720;
    const count = isMobile ? 1500 : 4000;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = Math.random() * 8 + 0.4;
      const angle = Math.random() * Math.PI * 2;
      const depth = (Math.random() - 0.5) * 16;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = depth;
      seeds[i] = Math.random();
      radii[i] = radius;
      angles[i] = angle;

      const roll = Math.random();
      if (roll < 0.55) {
        colors[i * 3 + 0] = 0.94;
        colors[i * 3 + 1] = 0.78;
        colors[i * 3 + 2] = 0.32;
      } else if (roll < 0.92) {
        colors[i * 3 + 0] = 0.30;
        colors[i * 3 + 1] = 0.92;
        colors[i * 3 + 2] = 0.65;
      } else {
        colors[i * 3 + 0] = 0.95;
        colors[i * 3 + 1] = 0.25;
        colors[i * 3 + 2] = 0.20;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const tex = this._sparkleTexture();
    this.uniforms = {
      uTime: { value: 0 },
      uTex: { value: tex },
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
        attribute float aRadius;
        attribute float aAngle;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uProgress;
        uniform float uPixelRatio;
        varying vec3 vCol;
        varying float vAlpha;
        void main() {
          float tightened = mix(0.0, 0.22, uProgress);
          float life = fract(uTime * (0.18 + uProgress * 0.04) + aSeed + tightened);
          float r = mix(aRadius, 0.05, pow(life, 0.92 + uProgress * 0.35));
          float a = aAngle + life * (6.0 + uProgress * 3.0);
          vec3 p;
          p.x = cos(a) * r;
          p.y = sin(a) * r;
          p.z = position.z * (1.0 - life * (0.7 + uProgress * 0.15));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.5 + 4.8 * (1.0 - life)) * 58.0 * uPixelRatio / -mv.z;
          vCol = aColor;
          vAlpha = smoothstep(0.0, 0.14, life) * (1.0 - smoothstep(0.82, 1.0, life)) * uOpacity;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec3 vCol;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vCol, tex.a * vAlpha);
        }
      `,
    });

    this.points = new THREE.Points(geo, this.pointsMat);
    this.points.position.set(0, 1.5, -5);

    this.coreMat = new THREE.MeshBasicMaterial({
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
    });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), this.coreMat);
    this.core.position.set(0, 1.5, -5);

    this.coreHaloMat = new THREE.SpriteMaterial({
      map: tex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coreHalo = new THREE.Sprite(this.coreHaloMat);
    this.coreHalo.scale.setScalar(3.5);
    this.coreHalo.position.copy(this.core.position);

    this.outerHaloMat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xd4af37,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.outerHalo = new THREE.Sprite(this.outerHaloMat);
    this.outerHalo.scale.set(8.0, 8.0, 1);
    this.outerHalo.position.copy(this.core.position);

    this.group.add(this.points, this.outerHalo, this.coreHalo, this.core);
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
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
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

    this.points.rotation.z = t * (0.05 + this.progress * 0.03);
    this.points.rotation.x = Math.sin(t * 0.22) * 0.08;

    const pulse = 0.85 + Math.sin(t * 2.0) * 0.15 + this.progress * 0.08;
    this.core.scale.setScalar(pulse);
    this.coreHalo.scale.setScalar(3.5 * pulse);
    this.outerHalo.scale.setScalar(8.0 + this.progress * 4.5);

    this.coreMat.opacity = this.intensity;
    this.coreHaloMat.opacity = this.intensity * (0.38 + this.progress * 0.24);
    this.outerHaloMat.opacity = this.intensity * (0.08 + this.progress * 0.14);
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
