// The Green Light — a glowing emerald orb across dark, rippling water.
// The defining symbol of the novel: Daisy's dock light across the bay.

import * as THREE from 'three';

export class GreenLightScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // --- Starfield (cool white-blue, low) ---
    const starGeo = new THREE.BufferGeometry();
    const SC = window.innerWidth < 720 ? 220 : 500;
    const sp = new Float32Array(SC * 3);
    const ss = new Float32Array(SC);
    for (let i = 0; i < SC; i++) {
      sp[i*3+0] = (Math.random() - 0.5) * 90;
      sp[i*3+1] =  Math.random() * 25 + 4;
      sp[i*3+2] = -28 - Math.random() * 18;
      ss[i] = Math.random() * Math.PI * 2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute('aSeed',    new THREE.BufferAttribute(ss, 1));
    this.starUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    const starMat = new THREE.ShaderMaterial({
      uniforms: this.starUniforms,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 + sin(uTime * 1.4 + aSeed) * 0.6 + 1.4) * uPixelRatio;
          vTwinkle = 0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 2.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vTwinkle;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d));
          gl_FragColor = vec4(0.85, 0.93, 1.0, a * vTwinkle * uOpacity);
        }
      `,
    });
    this.stars = new THREE.Points(starGeo, starMat);

    // --- The orb itself ---
    const orbGeo = new THREE.SphereGeometry(0.42, 48, 48);
    this.orbMat = new THREE.MeshBasicMaterial({ color: 0x4dffaa, transparent: true });
    this.orb = new THREE.Mesh(orbGeo, this.orbMat);
    this.orb.position.set(0, 1.4, -22);

    // Three nested halos at different scales pulsing on their own rhythm
    const haloTex = this._makeRadialTexture();
    const mkHalo = (scale, opacity) => {
      const m = new THREE.SpriteMaterial({
        map: haloTex, color: 0x4dffaa, transparent: true,
        opacity, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const s = new THREE.Sprite(m);
      s.scale.set(scale, scale, 1);
      s.position.copy(this.orb.position);
      return s;
    };
    this.haloInner  = mkHalo(5.5, 0.95);
    this.haloMid    = mkHalo(11,  0.55);
    this.haloOuter  = mkHalo(26,  0.22);

    // Vertical "god ray" beam descending from the orb (a billboarded tall sprite)
    const beamTex = this._makeBeamTexture();
    this.beamMat = new THREE.SpriteMaterial({
      map: beamTex, color: 0x4dffaa, transparent: true,
      opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.beam = new THREE.Sprite(this.beamMat);
    this.beam.scale.set(2.2, 6.5, 1);
    this.beam.position.set(0, 0.6, -22.2);

    // Point light at the orb — it actually casts onto the water shader via uniforms,
    // but this also lights the dock if we ever add a Standard material there.
    this.light = new THREE.PointLight(0x4dffaa, 2.5, 40, 1.6);
    this.light.position.copy(this.orb.position);

    // --- Distant dock silhouette ---
    const dockMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
    this.dockMat = dockMat;
    this.dock = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.15), dockMat);
    this.dock.position.set(0, 1.05, -22.5);
    this.post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), dockMat);
    this.post.position.set(0, 1.3, -22.5);

    // --- Water plane with shader ripples + caustic streak ---
    const waterGeo = new THREE.PlaneGeometry(120, 120, 160, 160);
    this.waterUniforms = {
      uTime:         { value: 0 },
      uOpacity:      { value: 0 },
      uColorDeep:    { value: new THREE.Color(0x040912) },
      uColorShallow: { value: new THREE.Color(0x0a1f2e) },
      uGlowColor:    { value: new THREE.Color(0x4dffaa) },
      uGlowPos:      { value: new THREE.Vector2(0.0, -22.0) },
    };
    const waterMat = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      transparent: true,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float w  = sin(pos.x * 0.6 + uTime * 0.8) * 0.08;
                w += sin(pos.y * 0.9 + uTime * 1.2) * 0.06;
                w += sin((pos.x + pos.y) * 0.4 + uTime * 0.5) * 0.04;
                w += sin(pos.x * 1.7 + uTime * 2.1) * 0.02;
          pos.z += w;
          vWave = w;
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
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vWave;
        void main() {
          // Distance from the green light's xz position
          float d = distance(vWorldPos.xz, uGlowPos);
          // Vertical streak of reflected light coming toward camera
          float streak = exp(-abs(vWorldPos.x - uGlowPos.x) * 1.4)
                       * smoothstep(uGlowPos.y, uGlowPos.y + 22.0, vWorldPos.z);
          // Ripple breakup so the streak shimmers
          streak *= 0.55 + 0.45 * sin(vWorldPos.z * 1.3 + uTime * 2.0);
          streak *= 0.85 + 0.15 * sin(vWorldPos.z * 5.0 - uTime * 3.5);
          float falloff = exp(-d * 0.08);
          // Specular highlight at wave crests near streak
          float spec = smoothstep(0.06, 0.14, vWave) * exp(-abs(vWorldPos.x - uGlowPos.x) * 0.6);
          vec3 col = mix(uColorDeep, uColorShallow, smoothstep(0.0, 1.0, vUv.y));
          col += uGlowColor * (streak * 0.85 + falloff * 0.18 + spec * 0.6);
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0;

    // --- Distant land silhouette behind the orb ---
    const landMat = new THREE.MeshBasicMaterial({ color: 0x020509, transparent: true });
    this.landMat = landMat;
    this.land = new THREE.Mesh(new THREE.PlaneGeometry(60, 2.2), landMat);
    this.land.position.set(0, 1.0, -25);

    // --- Tree silhouettes along the far shore ---
    this.trees = new THREE.Group();
    const treeMat = new THREE.MeshBasicMaterial({ color: 0x010306, transparent: true });
    this.treeMat = treeMat;
    for (let i = 0; i < 18; i++) {
      const w = 0.7 + Math.random() * 1.4;
      const h = 0.6 + Math.random() * 1.1;
      const t = new THREE.Mesh(new THREE.PlaneGeometry(w, h), treeMat);
      t.position.set(-22 + i * 2.5 + (Math.random() - 0.5) * 0.6, 1.1 + h/2, -24.8);
      this.trees.add(t);
    }

    // --- Fireflies — tiny drifting motes around the orb ---
    const FF = window.innerWidth < 720 ? 30 : 70;
    const ffPos = new Float32Array(FF * 3);
    const ffSeed = new Float32Array(FF);
    for (let i = 0; i < FF; i++) {
      ffPos[i*3+0] = (Math.random() - 0.5) * 18;
      ffPos[i*3+1] = 0.8 + Math.random() * 3.2;
      ffPos[i*3+2] = -8 - Math.random() * 14;
      ffSeed[i] = Math.random() * Math.PI * 2;
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    ffGeo.setAttribute('aSeed',    new THREE.BufferAttribute(ffSeed, 1));
    this.ffUniforms = {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    const ffMat = new THREE.ShaderMaterial({
      uniforms: this.ffUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.5 + aSeed * 1.7) * 1.1;
          p.y += sin(uTime * 0.7 + aSeed) * 0.5;
          p.z += cos(uTime * 0.4 + aSeed * 1.3) * 0.7;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (3.0 + sin(uTime * 2.5 + aSeed) * 1.5) * 22.0 * uPixelRatio / -mv.z;
          vAlpha = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.4 + aSeed * 3.0));
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d));
          gl_FragColor = vec4(0.4, 1.0, 0.7, a * vAlpha * uOpacity);
        }
      `,
    });
    this.fireflies = new THREE.Points(ffGeo, ffMat);

    this.group.add(
      this.water, this.land, this.trees,
      this.dock, this.post,
      this.beam,
      this.haloOuter, this.haloMid, this.haloInner, this.orb, this.light,
      this.stars, this.fireflies,
    );

    this.group.visible = false;
    scene.add(this.group);
  }

  _makeRadialTexture() {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.15, 'rgba(180,255,210,0.95)');
    grad.addColorStop(0.45, 'rgba(77,255,170,0.45)');
    grad.addColorStop(1,    'rgba(31,184,122,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _makeBeamTexture() {
    const w = 64, h = 256;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // Vertical gradient: bright at top, fading to nothing at bottom
    // and horizontally tapering at edges
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const vy = 1 - y / h;
      for (let x = 0; x < w; x++) {
        const dx = (x - w/2) / (w/2);
        const horiz = Math.max(0, 1 - Math.abs(dx));
        const a = Math.pow(horiz, 2.5) * Math.pow(vy, 1.4);
        const i = (y * w + x) * 4;
        img.data[i+0] = 180;
        img.data[i+1] = 255;
        img.data[i+2] = 210;
        img.data[i+3] = Math.floor(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  setOpacity(a) {
    this._a = a;
    this.waterUniforms.uOpacity.value = a;
    this.starUniforms.uOpacity.value  = a * 0.95;
    this.ffUniforms.uOpacity.value    = a;
    this.orbMat.opacity        = a;
    this.haloInner.material.opacity = a * 0.95;
    this.haloMid.material.opacity   = a * 0.55;
    this.haloOuter.material.opacity = a * 0.22;
    this.beamMat.opacity       = a * 0.55;
    this.dockMat.opacity       = a;
    this.landMat.opacity       = a;
    this.treeMat.opacity       = a;
    this.light.intensity       = 2.5 * a;
  }

  update(t, _scrollProg, _amount) {
    if (!this.group.visible) return;
    this.waterUniforms.uTime.value = t;
    this.starUniforms.uTime.value  = t;
    this.ffUniforms.uTime.value    = t;

    // Orb pulse — two overlapping rhythms
    const slow = Math.sin(t * 0.7);
    const fast = Math.sin(t * 1.9 + slow * 0.6);
    const pulse = 0.92 + slow * 0.05 + fast * 0.04;
    this.orb.scale.setScalar(pulse);
    this.haloInner.scale.setScalar(5.5 * pulse);
    this.haloMid.scale.setScalar(11 * (0.95 + Math.sin(t * 0.45) * 0.08));
    this.haloOuter.scale.setScalar(26 * (0.95 + Math.sin(t * 0.32 + 1.0) * 0.05));
    this.light.intensity = 2.5 * pulse * (this._a ?? 1);

    // Drift the orb very slightly
    const oy = 1.4 + Math.sin(t * 0.6) * 0.05 + Math.sin(t * 1.7) * 0.015;
    this.orb.position.y = oy;
    this.haloInner.position.y = oy;
    this.haloMid.position.y   = oy;
    this.haloOuter.position.y = oy;
    this.light.position.y     = oy;
    this.beam.position.y      = 0.6 + Math.sin(t * 0.4) * 0.05;
    this.beamMat.opacity = (this._a ?? 1) * (0.45 + Math.sin(t * 1.1) * 0.12);
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
