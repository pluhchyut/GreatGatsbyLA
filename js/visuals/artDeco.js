// Daisy is now a readable human memory: a soft figure in warm light, smiling
// faintly and waving from a distance as if Gatsby can almost reach her.

import * as THREE from 'three';

export class ArtDecoScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    this.ambient = new THREE.AmbientLight(0x263142, 0);
    this.keyLight = new THREE.DirectionalLight(0xffefc8, 0);
    this.keyLight.position.set(3.5, 5.0, 6.5);
    this.rimLight = new THREE.DirectionalLight(0xf0cf65, 0);
    this.rimLight.position.set(-3.5, 2.5, -3.5);
    this.greenFill = new THREE.DirectionalLight(0x4dffaa, 0);
    this.greenFill.position.set(-5.0, 1.0, 4.0);

    this.backGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(244,233,216,0.85)', 'rgba(244,233,216,0)'),
      color: 0xd8b15a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.backGlow = new THREE.Sprite(this.backGlowMat);
    this.backGlow.position.set(0, 1.6, -8.6);
    this.backGlow.scale.set(12, 12, 1);

    this.figure = new THREE.Group();
    this.figure.position.set(0.45, 1.05, -5.9);
    this.figure.rotation.y = -0.28;

    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xf4d7ba,
      roughness: 0.62,
      transparent: true,
      opacity: 0,
    });
    this.hairMat = new THREE.MeshStandardMaterial({
      color: 0xd7b15a,
      roughness: 0.75,
      transparent: true,
      opacity: 0,
    });
    this.dressMat = new THREE.MeshStandardMaterial({
      color: 0xf4e9d8,
      roughness: 0.82,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x07101c,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.goldLineMat = new THREE.LineBasicMaterial({
      color: 0xf0cf65,
      transparent: true,
      opacity: 0,
    });
    this.greenLineMat = new THREE.LineBasicMaterial({
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
    });

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), this.skinMat);
    this.head.position.set(0, 1.48, 0);
    this.head.scale.set(0.86, 1.02, 0.78);

    this.hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), this.hairMat);
    this.hair.position.set(0, 1.58, -0.02);
    this.hair.scale.set(0.96, 0.72, 0.78);
    this.hair.rotation.x = 0.2;

    const dressShape = new THREE.Shape();
    dressShape.moveTo(-0.34, 0.98);
    dressShape.bezierCurveTo(-0.74, 0.48, -0.9, -0.1, -1.0, -0.86);
    dressShape.lineTo(0.96, -0.86);
    dressShape.bezierCurveTo(0.86, -0.1, 0.68, 0.48, 0.34, 0.98);
    dressShape.bezierCurveTo(0.18, 1.13, -0.18, 1.13, -0.34, 0.98);
    const dressGeo = new THREE.ShapeGeometry(dressShape, 28);
    this.dress = new THREE.Mesh(dressGeo, this.dressMat);
    this.dress.position.set(0, 0.24, 0);
    this.dress.scale.set(0.72, 0.86, 1);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 14), this.skinMat);
    neck.position.set(0, 1.15, 0);

    const armGeo = new THREE.CylinderGeometry(0.035, 0.042, 0.72, 12);
    armGeo.translate(0, -0.36, 0);
    this.leftArm = new THREE.Mesh(armGeo, this.skinMat);
    this.leftArm.position.set(-0.42, 0.94, 0.02);
    this.leftArm.rotation.z = -0.32;

    this.wavePivot = new THREE.Group();
    this.wavePivot.position.set(0.38, 0.94, 0.02);
    this.rightArm = new THREE.Mesh(armGeo.clone(), this.skinMat);
    this.rightArm.rotation.z = -2.38;
    this.rightArm.rotation.x = 0.06;
    this.wavePivot.add(this.rightArm);

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), this.skinMat);
    palm.position.set(0, -0.74, 0.0);
    this.rightArm.add(palm);

    const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
    this.leftEye = new THREE.Mesh(eyeGeo, this.shadowMat);
    this.leftEye.position.set(-0.095, 1.51, 0.285);
    this.rightEye = new THREE.Mesh(eyeGeo, this.shadowMat);
    this.rightEye.position.set(0.095, 1.51, 0.285);

    this.smile = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.09, 1.41, 0.305),
        new THREE.Vector3(-0.025, 1.385, 0.322),
        new THREE.Vector3(0.055, 1.395, 0.318),
        new THREE.Vector3(0.11, 1.43, 0.302),
      ]),
      this.goldLineMat,
    );

    this.greenEyeGlint = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._radialTex('rgba(77,255,170,0.9)', 'rgba(77,255,170,0)'),
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.greenEyeGlint.position.set(0.13, 1.52, 0.32);
    this.greenEyeGlint.scale.set(0.22, 0.22, 1);

    this.trails = new THREE.Group();
    this.trailMaterials = [];
    for (let i = 0; i < 4; i += 1) {
      const trailGeo = new THREE.PlaneGeometry(1.0 + i * 0.18, 2.7 + i * 0.18, 12, 18);
      const pos = trailGeo.attributes.position;
      for (let j = 0; j < pos.count; j += 1) {
        const y = pos.getY(j);
        pos.setZ(j, Math.sin(y * 2.0 + i) * 0.08);
      }
      pos.needsUpdate = true;
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf4e9d8 : 0xf0cf65,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const trail = new THREE.Mesh(trailGeo, mat);
      trail.position.set(-0.16 + i * 0.12, 0.42 - i * 0.05, -0.5 - i * 0.32);
      trail.rotation.y = -0.16 + i * 0.1;
      trail.userData.seed = Math.random() * Math.PI * 2;
      trail.userData.basePosition = trail.position.clone();
      this.trailMaterials.push(mat);
      this.trails.add(trail);
    }

    this.dust = this._makeDust();

    this.figure.add(
      this.trails,
      this.dress,
      neck,
      this.leftArm,
      this.wavePivot,
      this.head,
      this.hair,
      this.leftEye,
      this.rightEye,
      this.smile,
      this.greenEyeGlint,
    );

    this.group.add(
      this.ambient,
      this.keyLight,
      this.rimLight,
      this.greenFill,
      this.backGlow,
      this.figure,
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
    const count = window.innerWidth < 720 ? 80 : 150;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 1] = Math.random() * 4.2 - 0.1;
      positions[i * 3 + 2] = -Math.random() * 7.5 - 2;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTex: { value: this._radialTex('rgba(255,250,240,1)', 'rgba(255,250,240,0)') },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.24 + aSeed * 8.0) * 0.18;
          p.y += cos(uTime * 0.3 + aSeed * 9.0) * 0.1;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.6 + aSeed * 4.2) * 22.0 * uPixelRatio / -mv.z;
          vAlpha = 0.3 + aSeed * 0.55;
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

    const smileWarmth = 0.7 + Math.sin(t * 0.8) * 0.08 + this.progress * 0.18;
    const wave = Math.sin(t * 1.4 + this.progress * 2.0) * 0.22;

    this.ambient.intensity = this.intensity * 0.46;
    this.keyLight.intensity = this.intensity * (1.25 + this.progress * 0.3);
    this.rimLight.intensity = this.intensity * 0.65;
    this.greenFill.intensity = this.intensity * (0.14 + this.progress * 0.18);
    this.backGlowMat.opacity = this.intensity * (0.12 + this.progress * 0.22);

    this.skinMat.opacity = this.intensity * 0.92;
    this.hairMat.opacity = this.intensity * 0.9;
    this.dressMat.opacity = this.intensity * 0.86;
    this.shadowMat.opacity = this.intensity * 0.62;
    this.goldLineMat.opacity = this.intensity * smileWarmth;
    this.greenLineMat.opacity = this.intensity * (0.18 + this.progress * 0.22);
    this.greenEyeGlint.material.opacity = this.intensity * (0.14 + Math.sin(t * 1.8) * 0.04 + this.progress * 0.08);

    this.figure.position.x = 0.45 + Math.sin(t * 0.18) * 0.08;
    this.figure.position.y = 1.05 + Math.sin(t * 0.32) * 0.05;
    this.figure.rotation.y = -0.28 + Math.sin(t * 0.22) * 0.06;
    this.figure.rotation.z = Math.sin(t * 0.16) * 0.02;
    this.head.rotation.y = Math.sin(t * 0.42) * 0.08;
    this.wavePivot.rotation.z = -0.12 + wave;
    this.wavePivot.rotation.x = Math.sin(t * 0.75) * 0.05;

    this.trails.children.forEach((trail, index) => {
      const base = trail.userData.basePosition;
      const sway = Math.sin(t * (0.52 + index * 0.08) + trail.userData.seed);
      trail.position.x = base.x + sway * 0.07;
      trail.position.y = base.y + Math.cos(t * 0.4 + trail.userData.seed) * 0.04;
      trail.rotation.y = -0.16 + index * 0.1 + sway * 0.05;
      this.trailMaterials[index].opacity = this.intensity * (0.045 + index * 0.014 + this.progress * 0.024);
    });

    this.dustUniforms.uTime.value = t;
    this.dustUniforms.uOpacity.value = this.intensity * (0.28 + this.progress * 0.08);
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
