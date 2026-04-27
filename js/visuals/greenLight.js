// The Green Light — a glowing emerald orb across dark, rippling water.
// This chapter leans into atmosphere: shimmer, horizon haze, and a reflection
// that sharpens as the reader moves deeper into Gatsby's longing.

import * as THREE from 'three';

export class GreenLightScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    const haloTex = this._makeRadialTexture('#4dffaa');

    const orbGeo = new THREE.SphereGeometry(0.42, 48, 48);
    this.orbMat = new THREE.MeshBasicMaterial({
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
    });
    this.orb = new THREE.Mesh(orbGeo, this.orbMat);
    this.orb.position.set(0, 1.45, -22);

    this.haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.halo = new THREE.Sprite(this.haloMat);
    this.halo.scale.set(8, 8, 1);
    this.halo.position.copy(this.orb.position);

    this.outerHaloMat = this.haloMat.clone();
    this.outerHalo = new THREE.Sprite(this.outerHaloMat);
    this.outerHalo.scale.set(22, 22, 1);
    this.outerHalo.position.copy(this.orb.position);

    this.reflectionHaloMat = this.haloMat.clone();
    this.reflectionHalo = new THREE.Sprite(this.reflectionHaloMat);
    this.reflectionHalo.scale.set(5.2, 16, 1);
    this.reflectionHalo.position.set(0, 0.4, -16);

    this.light = new THREE.PointLight(0x4dffaa, 0, 42, 1.5);
    this.light.position.copy(this.orb.position);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 140;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 54;
      starPos[i * 3 + 1] = Math.random() * 15 + 4.5;
      starPos[i * 3 + 2] = -18 - Math.random() * 18;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: 0xdff8ef,
      size: 0.08,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(starGeo, this.starsMat);

    const dockGeo = new THREE.BoxGeometry(3.8, 0.06, 0.18);
    this.dockMat = new THREE.MeshBasicMaterial({
      color: 0x010204,
      transparent: true,
      opacity: 0,
    });
    this.dock = new THREE.Mesh(dockGeo, this.dockMat);
    this.dock.position.set(0, 1.08, -22.55);

    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.52, 10);
    this.post = new THREE.Mesh(postGeo, this.dockMat);
    this.post.position.set(0, 1.33, -22.55);

    const waterGeo = new THREE.PlaneGeometry(90, 90, 180, 180);
    this.waterUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uProgress: { value: 0 },
      uColorDeep: { value: new THREE.Color(0x030812) },
      uColorShallow: { value: new THREE.Color(0x0d2234) },
      uGlowColor: { value: new THREE.Color(0x4dffaa) },
      uGlowPos: { value: new THREE.Vector2(0.0, -22.0) },
    };
    this.waterMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: this.waterUniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 0.45 + uTime * 0.6) * 0.10;
          wave += sin(pos.y * 0.85 + uTime * 1.0) * 0.07;
          wave += sin((pos.x + pos.y) * 0.32 + uTime * 0.35) * 0.05;
          wave += sin(length(pos.xy) * 0.22 - uTime * 0.28) * 0.04 * (0.4 + uProgress * 0.6);
          pos.z += wave;
          vWave = wave;
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorDeep;
        uniform vec3 uColorShallow;
        uniform vec3 uGlowColor;
        uniform vec2 uGlowPos;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uProgress;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorldPos;
        void main() {
          float distToGlow = distance(vWorldPos.xz, uGlowPos);
          float streak = exp(-abs(vWorldPos.x - uGlowPos.x) * 1.2);
          streak *= smoothstep(uGlowPos.y - 1.0, uGlowPos.y + 24.0, vWorldPos.z);
          streak *= 0.55 + 0.45 * sin(vWorldPos.z * 1.4 + uTime * 1.8);
          float reflection = streak * (0.45 + uProgress * 0.9);
          float halo = exp(-distToGlow * 0.075) * 0.24;
          float fresnel = pow(1.0 - abs(vUv.y - 0.08), 2.4);
          float crest = smoothstep(0.03, 0.16, vWave);

          vec3 col = mix(uColorDeep, uColorShallow, smoothstep(0.02, 0.95, vUv.y));
          col += uGlowColor * (reflection + halo);
          col += vec3(0.05, 0.08, 0.12) * crest;
          col += uGlowColor * fresnel * 0.035;

          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
    this.water = new THREE.Mesh(waterGeo, this.waterMat);
    this.water.rotation.x = -Math.PI / 2;

    const landGeo = new THREE.PlaneGeometry(60, 2.4);
    this.landMat = new THREE.MeshBasicMaterial({
      color: 0x02060a,
      transparent: true,
      opacity: 0,
    });
    this.land = new THREE.Mesh(landGeo, this.landMat);
    this.land.position.set(0, 1.05, -25);

    this.hazeMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x103426,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.haze = new THREE.Sprite(this.hazeMat);
    this.haze.scale.set(26, 7.5, 1);
    this.haze.position.set(0, 1.5, -23);

    this.group.add(
      this.water,
      this.land,
      this.haze,
      this.dock,
      this.post,
      this.stars,
      this.reflectionHalo,
      this.outerHalo,
      this.halo,
      this.orb,
      this.light,
    );

    this.group.visible = false;
    scene.add(this.group);
  }

  _makeRadialTexture(color) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.14, color);
    grad.addColorStop(0.55, 'rgba(31,184,122,0.26)');
    grad.addColorStop(1, 'rgba(31,184,122,0)');
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

    this.waterUniforms.uTime.value = t;
    this.waterUniforms.uOpacity.value = this.intensity;
    this.waterUniforms.uProgress.value = this.progress;

    const pulse = 0.92 + Math.sin(t * 1.35) * 0.08 + this.progress * 0.05;
    const bob = Math.sin(t * 0.58) * 0.06;
    const glow = this.intensity * (0.7 + this.progress * 0.7);

    this.orb.position.y = 1.45 + bob;
    this.halo.position.copy(this.orb.position);
    this.outerHalo.position.copy(this.orb.position);
    this.light.position.copy(this.orb.position);

    this.orb.scale.setScalar(pulse);
    this.halo.scale.set(8.2 * pulse, 8.2 * pulse, 1);
    this.outerHalo.scale.set(22.0 * (0.95 + pulse * 0.05), 22.0 * (0.95 + pulse * 0.05), 1);
    this.reflectionHalo.scale.set(5.2, 14.0 + this.progress * 6.0, 1);
    this.reflectionHalo.position.y = 0.3 + Math.sin(t * 0.32) * 0.06;

    this.orbMat.opacity = this.intensity;
    this.haloMat.opacity = this.intensity * 0.78;
    this.outerHaloMat.opacity = this.intensity * 0.22;
    this.reflectionHaloMat.opacity = this.intensity * (0.12 + this.progress * 0.22);
    this.hazeMat.opacity = this.intensity * 0.18;
    this.dockMat.opacity = this.intensity * 0.88;
    this.landMat.opacity = this.intensity * 0.92;
    this.starsMat.opacity = this.intensity * 0.65;
    this.light.intensity = 2.9 * glow;

    this.stars.rotation.z = t * 0.01;
    this.group.position.x = Math.sin(t * 0.12) * 0.08;
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
