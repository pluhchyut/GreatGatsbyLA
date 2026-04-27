// The Green Light — a glowing emerald orb across dark, rippling water.
// The defining symbol of the novel: Daisy's dock light across the bay.

import * as THREE from 'three';

export class GreenLightScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // --- The orb itself ---
    const orbGeo = new THREE.SphereGeometry(0.42, 48, 48);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x4dffaa });
    this.orb = new THREE.Mesh(orbGeo, orbMat);
    this.orb.position.set(0, 1.4, -22);

    // Glow halo (sprite)
    const haloTex = this._makeRadialTexture('#4dffaa');
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.halo = new THREE.Sprite(haloMat);
    this.halo.scale.set(8, 8, 1);
    this.halo.position.copy(this.orb.position);

    // Outer faint halo
    const haloMat2 = haloMat.clone();
    haloMat2.opacity = 0.35;
    this.haloOuter = new THREE.Sprite(haloMat2);
    this.haloOuter.scale.set(22, 22, 1);
    this.haloOuter.position.copy(this.orb.position);

    // Point light at the orb
    this.light = new THREE.PointLight(0x4dffaa, 2.5, 40, 1.6);
    this.light.position.copy(this.orb.position);

    // --- Distant dock silhouette (a thin dark bar on the water) ---
    const dockGeo = new THREE.BoxGeometry(3.5, 0.06, 0.15);
    const dockMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.dock = new THREE.Mesh(dockGeo, dockMat);
    this.dock.position.set(0, 1.05, -22.5);

    // Dock post
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    this.post = new THREE.Mesh(postGeo, dockMat);
    this.post.position.set(0, 1.3, -22.5);

    // --- Water plane with shader ripples ---
    const waterGeo = new THREE.PlaneGeometry(80, 80, 120, 120);
    this.waterUniforms = {
      uTime:      { value: 0 },
      uColorDeep: { value: new THREE.Color(0x040912) },
      uColorShallow: { value: new THREE.Color(0x0a1f2e) },
      uGlowColor: { value: new THREE.Color(0x4dffaa) },
      uGlowPos:   { value: new THREE.Vector2(0.0, -22.0) },
    };
    const waterMat = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave  = sin(pos.x * 0.6 + uTime * 0.8) * 0.08;
                wave += sin(pos.y * 0.9 + uTime * 1.2) * 0.06;
                wave += sin((pos.x + pos.y) * 0.4 + uTime * 0.5) * 0.04;
          pos.z += wave;
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
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          // Distance from the green light's xz position
          float d = distance(vWorldPos.xz, uGlowPos);
          // Vertical streak of reflected light coming toward camera
          float streak = exp(-abs(vWorldPos.x - uGlowPos.x) * 1.4)
                       * smoothstep(uGlowPos.y, uGlowPos.y + 22.0, vWorldPos.z);
          streak *= 0.55 + 0.45 * sin(vWorldPos.z * 1.3 + uTime * 2.0);
          float falloff = exp(-d * 0.08);
          vec3 col = mix(uColorDeep, uColorShallow, smoothstep(0.0, 1.0, vUv.y));
          col += uGlowColor * (streak * 0.7 + falloff * 0.15);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0;

    // --- Distant land silhouette behind the orb ---
    const landGeo = new THREE.PlaneGeometry(60, 2.2);
    const landMat = new THREE.MeshBasicMaterial({ color: 0x020509 });
    this.land = new THREE.Mesh(landGeo, landMat);
    this.land.position.set(0, 1.0, -25);

    this.group.add(
      this.water, this.land,
      this.dock, this.post,
      this.haloOuter, this.halo, this.orb, this.light,
    );

    this.group.visible = false;
    scene.add(this.group);
  }

  _makeRadialTexture(color) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.15, color);
    grad.addColorStop(0.6,  'rgba(31,184,122,0.35)');
    grad.addColorStop(1,    'rgba(31,184,122,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t, scrollProg) {
    if (!this.group.visible) return;
    this.waterUniforms.uTime.value = t;

    // Subtle pulse on the orb
    const pulse = 0.92 + Math.sin(t * 1.4) * 0.08;
    this.orb.scale.setScalar(pulse);
    this.halo.scale.setScalar(8 * pulse);
    this.light.intensity = 2.5 * pulse;

    // Drift the orb very slightly
    this.orb.position.y = 1.4 + Math.sin(t * 0.6) * 0.05;
    this.halo.position.y = this.orb.position.y;
    this.haloOuter.position.y = this.orb.position.y;
    this.light.position.y = this.orb.position.y;
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
