// Gatsby's mansion: stately, overlit, and a little haunted.
// The animation aims for cinematic uneven life — rows of windows dimming
// together as guests leave, slow chimney smoke, distant ridge silhouettes,
// terrace lamps that breathe, and a warm crowd glow at the base of the
// house that fades as the chapter's progress advances toward emptiness.

import * as THREE from 'three';

export class MansionScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    // ---------- Stars ----------
    const starGeo = new THREE.BufferGeometry();
    const starCount = window.innerWidth < 720 ? 360 : 720;
    const starPos = new Float32Array(starCount * 3);
    const starSeed = new Float32Array(starCount);
    for (let i = 0; i < starCount; i += 1) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 90;
      starPos[i * 3 + 1] = Math.random() * 30 + 4;
      starPos[i * 3 + 2] = -30 - Math.random() * 22;
      starSeed[i] = Math.random() * Math.PI * 2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('aSeed', new THREE.BufferAttribute(starSeed, 1));
    this.starUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    this.starMat = new THREE.ShaderMaterial({
      uniforms: this.starUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 + sin(uTime * 1.4 + aSeed) * 0.55 + 1.4) * uPixelRatio;
          vTwinkle = 0.55 + 0.45 * sin(uTime * 1.8 + aSeed * 1.7);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vTwinkle;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d));
          gl_FragColor = vec4(1.0, 0.96, 0.82, a * vTwinkle * uOpacity);
        }
      `,
    });
    this.stars = new THREE.Points(starGeo, this.starMat);

    // ---------- Sky glow behind house ----------
    const skyTex = this._radialTex('rgba(24,38,62,0.9)', 'rgba(7,16,28,0)');
    this.skyGlowMat = new THREE.SpriteMaterial({
      map: skyTex, color: 0x314766,
      transparent: true, opacity: 0, depthWrite: false,
    });
    this.skyGlow = new THREE.Sprite(this.skyGlowMat);
    this.skyGlow.position.set(0, 9.5, -25);
    this.skyGlow.scale.set(48, 24, 1);

    // ---------- Distant ridge silhouettes ----------
    this.ridges = new THREE.Group();
    const ridgeMatA = new THREE.MeshBasicMaterial({ color: 0x040912, transparent: true, opacity: 0 });
    const ridgeMatB = new THREE.MeshBasicMaterial({ color: 0x070e18, transparent: true, opacity: 0 });
    this.ridgeMats = [ridgeMatA, ridgeMatB];
    const ridgeShape = (segs, amp, baseY) => {
      const shape = new THREE.Shape();
      shape.moveTo(-30, 0);
      for (let i = 0; i <= segs; i += 1) {
        const x = -30 + (60 * i / segs);
        const y = baseY + Math.sin(i * 1.7 + amp) * amp + Math.sin(i * 0.6 + 1.3) * (amp * 0.6);
        shape.lineTo(x, y);
      }
      shape.lineTo(30, 0);
      shape.lineTo(-30, 0);
      return new THREE.ShapeGeometry(shape);
    };
    const farRidge = new THREE.Mesh(ridgeShape(28, 0.65, 1.6), ridgeMatA);
    farRidge.position.set(0, 0, -27);
    const nearRidge = new THREE.Mesh(ridgeShape(36, 0.45, 1.0), ridgeMatB);
    nearRidge.position.set(0, 0, -22);
    this.ridges.add(farRidge, nearRidge);

    // ---------- Moon ----------
    const moonGeo = new THREE.CircleGeometry(1.6, 48);
    this.moonMat = new THREE.MeshBasicMaterial({
      color: 0xf4e9d8, transparent: true, opacity: 0,
    });
    this.moon = new THREE.Mesh(moonGeo, this.moonMat);
    this.moon.position.set(-9, 9, -25);

    const moonHaloTex = this._radialTex('rgba(244,233,216,0.9)', 'rgba(244,233,216,0)');
    this.moonHaloMat = new THREE.SpriteMaterial({
      map: moonHaloTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.moonHalo = new THREE.Sprite(this.moonHaloMat);
    this.moonHalo.scale.setScalar(7);
    this.moonHalo.position.copy(this.moon.position);

    // ---------- Mansion silhouette ----------
    const shape = new THREE.Shape();
    shape.moveTo(-9, 0);
    shape.lineTo(-9, 1.4);
    shape.lineTo(-7.2, 1.4); shape.lineTo(-7.2, 2.0);
    shape.lineTo(-5.4, 2.0); shape.lineTo(-5.4, 1.4);
    shape.lineTo(-4.0, 1.4); shape.lineTo(-4.0, 2.4);
    shape.lineTo(-2.6, 2.4); shape.lineTo(-2.6, 3.6);
    shape.lineTo(-1.6, 3.6); shape.lineTo(-1.6, 4.0);
    shape.lineTo(-1.2, 4.0); shape.lineTo(-0.9, 4.6);
    shape.lineTo(-0.6, 5.1); shape.lineTo(-0.3, 5.4);
    shape.lineTo( 0.0, 5.6);
    shape.lineTo( 0.3, 5.4); shape.lineTo( 0.6, 5.1);
    shape.lineTo( 0.9, 4.6); shape.lineTo( 1.2, 4.0);
    shape.lineTo( 1.6, 4.0); shape.lineTo( 1.6, 3.6);
    shape.lineTo( 2.6, 3.6); shape.lineTo( 2.6, 2.4);
    shape.lineTo( 4.0, 2.4); shape.lineTo( 4.0, 1.4);
    shape.lineTo( 5.4, 1.4); shape.lineTo( 5.4, 2.0);
    shape.lineTo( 7.2, 2.0); shape.lineTo( 7.2, 1.4);
    shape.lineTo( 9, 1.4);   shape.lineTo( 9, 0);
    shape.lineTo(-9, 0);
    const mansionGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: false });
    mansionGeo.translate(0, 0, -1.0);
    this.mansionMat = new THREE.MeshBasicMaterial({
      color: 0x010306, transparent: true, opacity: 0,
    });
    this.mansion = new THREE.Mesh(mansionGeo, this.mansionMat);
    this.mansion.position.set(0, 0.3, -14);

    // ---------- Windows (with row-grouped behavior) ----------
    this.windows = new THREE.Group();
    // Each window: [x, y, w, h, brightness, rowGroup]
    // rowGroup buckets windows into rows so we can dim "rooms" together.
    const windowDefs = [
      // left wing — row 0
      [-8.4, 0.9, 0.22, 0.32, 0.8, 0], [-8.0, 0.9, 0.22, 0.32, 0.5, 0],
      [-7.6, 0.9, 0.22, 0.32, 0.9, 0], [-6.6, 0.9, 0.22, 0.32, 0.7, 0],
      [-6.2, 0.9, 0.22, 0.32, 0.4, 0], [-5.8, 0.9, 0.22, 0.32, 0.95, 0],
      // left wing upper — row 1
      [-6.6, 1.7, 0.2, 0.22, 0.9, 1], [-6.0, 1.7, 0.2, 0.22, 0.6, 1],
      // central ground — row 2
      [-3.5, 0.9, 0.28, 0.42, 1.0, 2], [-3.0, 0.9, 0.28, 0.42, 0.7, 2],
      [-2.5, 0.9, 0.28, 0.42, 0.4, 2], [-2.0, 0.9, 0.28, 0.42, 0.95, 2],
      [-1.5, 0.9, 0.28, 0.42, 0.6, 2], [-1.0, 0.9, 0.28, 0.42, 0.85, 2],
      [-0.5, 0.9, 0.28, 0.42, 1.0, 2], [ 0.0, 0.9, 0.28, 0.42, 0.5, 2],
      [ 0.5, 0.9, 0.28, 0.42, 0.85, 2], [ 1.0, 0.9, 0.28, 0.42, 0.95, 2],
      [ 1.5, 0.9, 0.28, 0.42, 0.5, 2], [ 2.0, 0.9, 0.28, 0.42, 0.9, 2],
      [ 2.5, 0.9, 0.28, 0.42, 0.7, 2], [ 3.0, 0.9, 0.28, 0.42, 1.0, 2],
      [ 3.5, 0.9, 0.28, 0.42, 0.4, 2],
      // central upper — row 3
      [-3.2, 1.7, 0.24, 0.32, 0.8, 3], [-2.6, 1.7, 0.24, 0.32, 0.95, 3],
      [-2.0, 1.7, 0.24, 0.32, 0.55, 3], [-1.4, 1.7, 0.24, 0.32, 0.9, 3],
      [-0.8, 1.7, 0.24, 0.32, 0.7, 3], [-0.2, 1.7, 0.24, 0.32, 1.0, 3],
      [ 0.4, 1.7, 0.24, 0.32, 0.6, 3], [ 1.0, 1.7, 0.24, 0.32, 0.85, 3],
      [ 1.6, 1.7, 0.24, 0.32, 0.95, 3], [ 2.2, 1.7, 0.24, 0.32, 0.5, 3],
      [ 2.8, 1.7, 0.24, 0.32, 0.9, 3],
      // tower — row 4
      [-2.0, 2.7, 0.22, 0.32, 1.0, 4], [-1.4, 2.7, 0.22, 0.32, 0.7, 4],
      [ 1.2, 2.7, 0.22, 0.32, 0.9, 4], [ 1.8, 2.7, 0.22, 0.32, 0.85, 4],
      // cupola — row 5
      [-0.6, 3.1, 0.22, 0.5, 1.0, 5], [ 0.4, 3.1, 0.22, 0.5, 0.95, 5],
      // right wing — row 0 again
      [ 5.8, 0.9, 0.22, 0.32, 0.85, 0], [ 6.2, 0.9, 0.22, 0.32, 0.5, 0],
      [ 6.6, 0.9, 0.22, 0.32, 0.95, 0], [ 7.6, 0.9, 0.22, 0.32, 0.7, 0],
      [ 8.0, 0.9, 0.22, 0.32, 0.4, 0], [ 8.4, 0.9, 0.22, 0.32, 0.9, 0],
      // right wing upper — row 1
      [ 6.0, 1.7, 0.2, 0.22, 0.7, 1], [ 6.6, 1.7, 0.2, 0.22, 0.95, 1],
    ];
    this.windowMeshes = [];
    // Per-row dimming envelope so rows of rooms can darken together
    this.rowDim = [1, 1, 1, 1, 1, 1];
    this.rowTarget = [1, 1, 1, 1, 1, 1];
    this.rowNextShift = [0, 0, 0, 0, 0, 0];
    windowDefs.forEach(([x, y, w, h, bright, row]) => {
      const wg = new THREE.PlaneGeometry(w, h);
      const wm = new THREE.MeshBasicMaterial({
        color: 0xf0cf65, transparent: true, opacity: 0,
      });
      const win = new THREE.Mesh(wg, wm);
      win.position.set(x, y + 0.05, -13.0);
      win.userData.bright = bright;
      win.userData.row = row;
      win.userData.seed = Math.random() * Math.PI * 2;
      win.userData.currentDip = 1;
      win.userData.targetDip = 1;
      win.userData.nextShift = Math.random() * 1.4;
      this.windows.add(win);
      this.windowMeshes.push(win);
    });

    // ---------- Crowd glow at the base of the mansion ----------
    const crowdTex = this._radialTex('rgba(240,207,101,0.9)', 'rgba(240,207,101,0)');
    this.crowdGlowMat = new THREE.SpriteMaterial({
      map: crowdTex, color: 0xf0cf65, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.crowdGlow = new THREE.Sprite(this.crowdGlowMat);
    this.crowdGlow.scale.set(20, 4.4, 1);
    this.crowdGlow.position.set(0, 0.85, -12.4);

    // ---------- Mansion warm aura ----------
    const glowTex = this._radialTex('rgba(240,207,101,0.5)', 'rgba(240,207,101,0)');
    this.mansionGlowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.mansionGlow = new THREE.Sprite(this.mansionGlowMat);
    this.mansionGlow.scale.set(30, 18, 1);
    this.mansionGlow.position.set(0, 1.8, -13.5);

    // ---------- Lawn ----------
    const lawnGeo = new THREE.PlaneGeometry(60, 40);
    this.lawnMat = new THREE.MeshBasicMaterial({
      color: 0x030608, transparent: true, opacity: 0,
    });
    this.lawn = new THREE.Mesh(lawnGeo, this.lawnMat);
    this.lawn.rotation.x = -Math.PI / 2;
    this.lawn.position.z = -8;

    // ---------- Low fog band along ground ----------
    const fogBandTex = this._radialTex('rgba(180,200,220,0.35)', 'rgba(180,200,220,0)');
    this.fogBandMat = new THREE.SpriteMaterial({
      map: fogBandTex, color: 0x6f8290, transparent: true, opacity: 0,
      depthWrite: false,
    });
    this.fogBand = new THREE.Sprite(this.fogBandMat);
    this.fogBand.scale.set(48, 3.2, 1);
    this.fogBand.position.set(0, 0.55, -13);

    // ---------- Terrace lamps ----------
    this.terraceLights = new THREE.Group();
    this.terraceLightMats = [];
    for (let i = 0; i < 6; i += 1) {
      const m = new THREE.SpriteMaterial({
        map: glowTex, color: 0xf0cf65, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const lamp = new THREE.Sprite(m);
      lamp.scale.set(1.4, 1.4, 1);
      lamp.position.set(-5 + i * 2.0, 0.4 + (i % 2) * 0.05, -11.2);
      lamp.userData.seed = Math.random() * Math.PI * 2;
      this.terraceLights.add(lamp);
      this.terraceLightMats.push(m);
    }

    // ---------- Chimney smoke (cupola) ----------
    const SMOKE = window.innerWidth < 720 ? 60 : 140;
    const smokePos = new Float32Array(SMOKE * 3);
    const smokeSeed = new Float32Array(SMOKE);
    for (let i = 0; i < SMOKE; i += 1) {
      smokePos[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
      smokePos[i * 3 + 1] = Math.random() * 4.0;
      smokePos[i * 3 + 2] = 0;
      smokeSeed[i] = Math.random();
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    smokeGeo.setAttribute('aSeed', new THREE.BufferAttribute(smokeSeed, 1));
    this.smokeUniforms = {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    const smokeMat = new THREE.ShaderMaterial({
      uniforms: this.smokeUniforms,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float life = fract(uTime * 0.18 + aSeed);
          p.y = life * 5.5;
          p.x += sin(uTime * 0.6 + aSeed * 7.0) * (0.2 + life * 1.6);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (8.0 + life * 28.0) * 22.0 * uPixelRatio / -mv.z;
          vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.6, 1.0, life));
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d));
          gl_FragColor = vec4(0.55, 0.62, 0.7, a * vAlpha * 0.35 * uOpacity);
        }
      `,
    });
    this.smoke = new THREE.Points(smokeGeo, smokeMat);
    this.smoke.position.set(0, 5.7, -13);

    this.group.add(
      this.skyGlow,
      this.stars,
      this.ridges,
      this.moonHalo, this.moon,
      this.mansionGlow,
      this.crowdGlow,
      this.mansion,
      this.windows,
      this.terraceLights,
      this.fogBand,
      this.smoke,
      this.lawn,
    );
    this.group.visible = false;
    scene.add(this.group);
  }

  _radialTex(c0, c1) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
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
    const I = this.intensity;
    const P = this.progress;

    this.starUniforms.uTime.value = t;
    this.starUniforms.uOpacity.value = I * 0.85;
    this.smokeUniforms.uTime.value = t;
    this.smokeUniforms.uOpacity.value = I;

    this.skyGlowMat.opacity      = I * (0.18 - P * 0.05);
    this.moonMat.opacity         = I * 0.95;
    this.moonHaloMat.opacity     = I * (0.36 + Math.sin(t * 0.6) * 0.05);
    this.mansionMat.opacity      = I;
    // Warm aura fades as the chapter empties out.
    this.mansionGlowMat.opacity  = I * (0.30 - P * 0.18 + Math.sin(t * 0.9) * 0.03);
    // Crowd glow is brightest at start of chapter and dies to nothing.
    this.crowdGlowMat.opacity    = I * Math.max(0, (0.55 - P * 0.55) + Math.sin(t * 1.2) * 0.04);
    this.crowdGlow.scale.x       = 20 - P * 6.0;
    this.lawnMat.opacity         = I * 0.96;
    this.fogBandMat.opacity      = I * (0.16 + P * 0.18);
    this.fogBand.position.x      = Math.sin(t * 0.18) * 1.8;
    this.ridgeMats[0].opacity    = I * 0.82;
    this.ridgeMats[1].opacity    = I * 0.92;

    // Per-row dimming — rows occasionally drop together, like rooms emptying
    for (let r = 0; r < this.rowDim.length; r += 1) {
      if (t > this.rowNextShift[r]) {
        // As progress rises, rows are increasingly likely to be dim.
        const wantDim = Math.random() < (0.18 + P * 0.55);
        this.rowTarget[r] = wantDim ? 0.18 + Math.random() * 0.25 : 1.0;
        this.rowNextShift[r] = t + 1.4 + Math.random() * 3.0;
      }
      this.rowDim[r] += (this.rowTarget[r] - this.rowDim[r]) * 0.04;
    }

    this.windowMeshes.forEach((win) => {
      // Per-window micro flicker layered on top of row dimming
      if (t > win.userData.nextShift) {
        win.userData.targetDip = Math.random() < 0.10 ? 0.4 + Math.random() * 0.25 : 1.0;
        win.userData.nextShift = t + 0.25 + Math.random() * 1.6;
      }
      win.userData.currentDip += (win.userData.targetDip - win.userData.currentDip) * 0.08;
      const flicker = 0.88 + Math.sin(t * 1.4 + win.userData.seed) * 0.12;
      const breath  = 0.96 + Math.sin(t * 0.4 + win.userData.seed * 1.7) * 0.05;
      const rowMul  = this.rowDim[win.userData.row];
      const opacity = (0.46 + win.userData.bright * 0.46)
                    * flicker * breath
                    * win.userData.currentDip
                    * rowMul;
      win.material.opacity = opacity * I;
    });

    this.terraceLightMats.forEach((m, i) => {
      const seed = this.terraceLights.children[i].userData.seed;
      m.opacity = I * Math.max(0, (0.16 - P * 0.10) + Math.sin(t * 1.25 + seed) * 0.04);
      this.terraceLights.children[i].scale.setScalar(1.25 + Math.sin(t * 0.9 + seed) * 0.1);
    });

    this.moon.position.y = 9 + Math.sin(t * 0.12) * 0.2;
    this.moonHalo.position.copy(this.moon.position);
    this.group.position.x = Math.sin(t * 0.08) * 0.05;
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
