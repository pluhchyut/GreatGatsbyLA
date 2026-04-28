// Collapse is now a haunted memory corridor rather than a flashy spiral:
// misaligned frames, creeping shadows, drifting fragments, and a narrowing
// center line that feels like the past closing in.

import * as THREE from 'three';

export class VortexScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    this.ambient = new THREE.AmbientLight(0x141c27, 0);
    this.rim = new THREE.DirectionalLight(0xf0cf65, 0);
    this.rim.position.set(3, 4, 6);
    this.greenFill = new THREE.DirectionalLight(0x4dffaa, 0);
    this.greenFill.position.set(-4, 1, 5);

    this.depthGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(16,28,42,0.9)', 'rgba(16,28,42,0)'),
      color: 0x162638,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.depthGlow = new THREE.Sprite(this.depthGlowMat);
    this.depthGlow.position.set(0, 1.5, -9.5);
    this.depthGlow.scale.set(18, 14, 1);

    this.frames = new THREE.Group();
    this.frameMaterials = [];
    for (let i = 0; i < 8; i += 1) {
      const width = 5.6 + i * 1.05;
      const height = 3.8 + i * 0.78;
      const points = [
        new THREE.Vector3(-width / 2, -height / 2, 0),
        new THREE.Vector3(width / 2, -height / 2, 0),
        new THREE.Vector3(width / 2, height / 2, 0),
        new THREE.Vector3(-width / 2, height / 2, 0),
        new THREE.Vector3(-width / 2, -height / 2, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: i < 2 ? 0xd4af37 : 0x8ca7bf,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(geometry, material);
      line.position.set(0, 1.5, -3.5 - i * 2.5);
      line.rotation.z = (Math.random() - 0.5) * 0.08;
      line.userData.seed = Math.random() * Math.PI * 2;
      line.userData.basePosition = line.position.clone();
      line.userData.baseRotationZ = line.rotation.z;
      this.frameMaterials.push(material);
      this.frames.add(line);
    }

    this.panels = new THREE.Group();
    this.panelMaterials = [];
    for (let i = 0; i < 6; i += 1) {
      const panelMat = new THREE.MeshBasicMaterial({
        map: this._panelTex(i),
        color: i % 2 === 0 ? 0xf4e9d8 : 0xd4af37,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.6 + i * 0.18, 3.4 + i * 0.2), panelMat);
      panel.position.set(
        (i % 2 === 0 ? -1 : 1) * (0.55 + i * 0.22),
        1.2 + (i % 3) * 0.22,
        -4.8 - i * 1.85,
      );
      panel.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.22;
      panel.rotation.z = (Math.random() - 0.5) * 0.12;
      panel.userData.seed = Math.random() * Math.PI * 2;
      panel.userData.basePosition = panel.position.clone();
      panel.userData.baseRotationY = panel.rotation.y;
      panel.userData.baseRotationZ = panel.rotation.z;
      this.panelMaterials.push(panelMat);
      this.panels.add(panel);
    }

    this.leftShadow = this._makeShadowPlane();
    this.leftShadow.position.set(-4.8, 1.4, -4.4);
    this.leftShadow.rotation.y = 0.22;
    this.rightShadow = this._makeShadowPlane();
    this.rightShadow.position.set(4.8, 1.4, -4.4);
    this.rightShadow.rotation.y = -0.22;

    this.slitGlowMat = new THREE.SpriteMaterial({
      map: this._slitTex(),
      color: 0x9bc8a7,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.slitGlow = new THREE.Sprite(this.slitGlowMat);
    this.slitGlow.position.set(0.08, 1.52, -10.8);
    this.slitGlow.scale.set(1.1, 8.5, 1);

    this.fragments = this._makeFragments();

    this.group.add(
      this.ambient,
      this.rim,
      this.greenFill,
      this.depthGlow,
      this.frames,
      this.panels,
      this.leftShadow,
      this.rightShadow,
      this.slitGlow,
      this.fragments,
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

  _shadowTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, 'rgba(3,7,13,0.95)');
    grad.addColorStop(0.4, 'rgba(3,7,13,0.72)');
    grad.addColorStop(1, 'rgba(3,7,13,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _slitTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(77,255,170,0)');
    grad.addColorStop(0.18, 'rgba(77,255,170,0.55)');
    grad.addColorStop(0.5, 'rgba(244,233,216,0.82)');
    grad.addColorStop(0.82, 'rgba(77,255,170,0.55)');
    grad.addColorStop(1, 'rgba(77,255,170,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _panelTex(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,16,25,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, index % 2 === 0 ? 'rgba(244,233,216,0.3)' : 'rgba(212,175,55,0.24)');
    grad.addColorStop(0.55, 'rgba(244,233,216,0.06)');
    grad.addColorStop(1, 'rgba(8,16,25,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(244,233,216,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    ctx.strokeStyle = 'rgba(77,255,170,0.08)';
    ctx.beginPath();
    ctx.moveTo(20, canvas.height * 0.22);
    ctx.lineTo(canvas.width - 26, canvas.height * 0.18);
    ctx.moveTo(26, canvas.height * 0.66);
    ctx.lineTo(canvas.width - 20, canvas.height * 0.74);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _makeShadowPlane() {
    const material = new THREE.MeshBasicMaterial({
      map: this._shadowTex(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 7.2), material);
    mesh.userData.materialRef = material;
    return mesh;
  }

  _makeFragments() {
    const count = window.innerWidth < 720 ? 180 : 420;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const tint = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5 + 1.5;
      positions[i * 3 + 2] = -Math.random() * 16 - 2;
      seeds[i] = Math.random();
      const warm = Math.random();
      tint[i * 3 + 0] = warm > 0.72 ? 0.35 : 0.9;
      tint[i * 3 + 1] = warm > 0.72 ? 0.95 : 0.82;
      tint[i * 3 + 2] = warm > 0.72 ? 0.76 : 0.66;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uProgress: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTex: { value: this._radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)') },
      },
      vertexShader: `
        attribute float aSeed;
        attribute vec3 aTint;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uProgress;
        uniform float uPixelRatio;
        varying vec3 vTint;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float drift = sin(uTime * (0.35 + aSeed * 0.18) + aSeed * 12.0);
          p.x += drift * (0.18 + uProgress * 0.22);
          p.y += cos(uTime * 0.28 + aSeed * 14.0) * 0.12;
          p.z += mod(uTime * (0.9 + aSeed * 0.6) + aSeed * 9.0, 18.0);
          if (p.z > -2.0) p.z -= 18.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (4.0 + aSeed * 7.0) * 22.0 * uPixelRatio / -mv.z;
          vTint = aTint;
          vAlpha = (0.18 + aSeed * 0.5) * uOpacity;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec3 vTint;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vTint, tex.a * vAlpha);
        }
      `,
    });

    this.fragmentUniforms = material.uniforms;
    return new THREE.Points(geometry, material);
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

    this.ambient.intensity = this.intensity * 0.34;
    this.rim.intensity = this.intensity * (0.28 + (1 - this.progress) * 0.22);
    this.greenFill.intensity = this.intensity * (0.08 + this.progress * 0.16);
    this.depthGlowMat.opacity = this.intensity * (0.24 + this.progress * 0.18);
    this.slitGlowMat.opacity = this.intensity * (0.08 + this.progress * 0.3);

    this.frames.children.forEach((frame, index) => {
      const base = frame.userData.basePosition;
      const seed = frame.userData.seed;
      const collapse = this.progress * (0.22 + index * 0.018);
      frame.position.x = Math.sin(t * 0.28 + seed) * 0.15 * (index < 2 ? 1.4 : 0.8) + (index % 2 === 0 ? -collapse : collapse);
      frame.position.y = base.y + Math.cos(t * 0.22 + seed) * 0.08;
      frame.position.z = base.z + this.progress * index * 0.42;
      frame.rotation.z = frame.userData.baseRotationZ + Math.sin(t * 0.2 + seed) * 0.04;
      this.frameMaterials[index].opacity = this.intensity * (0.34 - index * 0.028);
    });

    this.panels.children.forEach((panel, index) => {
      const base = panel.userData.basePosition;
      const seed = panel.userData.seed;
      const slip = Math.sin(t * 0.4 + seed) * 0.14 + this.progress * (index % 2 === 0 ? -0.18 : 0.18);
      panel.position.x = base.x + slip;
      panel.position.y = base.y + Math.cos(t * 0.32 + seed) * 0.08;
      panel.position.z = base.z + Math.sin(t * 0.16 + seed) * 0.2 + this.progress * 0.3 * index;
      panel.rotation.y = panel.userData.baseRotationY + Math.sin(t * 0.24 + seed) * 0.06;
      panel.rotation.z = panel.userData.baseRotationZ + Math.cos(t * 0.26 + seed) * 0.04;
      this.panelMaterials[index].opacity = this.intensity * (0.08 + index * 0.03) * (1 - index * 0.06);
    });

    const leftMat = this.leftShadow.userData.materialRef;
    const rightMat = this.rightShadow.userData.materialRef;
    this.leftShadow.position.x = -4.8 + this.progress * 1.3;
    this.rightShadow.position.x = 4.8 - this.progress * 1.3;
    leftMat.opacity = this.intensity * (0.18 + this.progress * 0.28);
    rightMat.opacity = this.intensity * (0.18 + this.progress * 0.28);

    this.slitGlow.scale.set(1.05 + this.progress * 0.45, 8.5 + this.progress * 2.8, 1);
    this.slitGlow.position.x = Math.sin(t * 0.22) * 0.08;
    this.slitGlow.position.y = 1.52 + Math.sin(t * 0.18) * 0.06;

    this.fragmentUniforms.uTime.value = t;
    this.fragmentUniforms.uOpacity.value = this.intensity * (0.26 + this.progress * 0.16);
    this.fragmentUniforms.uProgress.value = this.progress;
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
