// Daisy as a 2D black flapper silhouette over a warm gold backdrop.
// Her smile and eyes are TRANSPARENT cutouts in the silhouette, so the
// warm light behind shines through her face — the effect of a memory
// almost coming back. One arm waves slowly, like someone calling from
// across the bay. Everything else here (gold backdrop, sweeping cream
// trails, drifting dust) is the dream pretending to be a person.

import * as THREE from 'three';

export class ArtDecoScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    // ---- Lighting (subtle: silhouette is unlit, but glints/dust react) ----
    this.ambient = new THREE.AmbientLight(0x263142, 0);
    this.keyLight = new THREE.DirectionalLight(0xffefc8, 0);
    this.keyLight.position.set(3.5, 5.0, 6.5);
    this.greenFill = new THREE.DirectionalLight(0x4dffaa, 0);
    this.greenFill.position.set(-5.0, 1.0, 4.0);

    // ---- Warm gold backdrop (this is what shows through Daisy's smile) ----
    this.backGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(255,228,168,1)', 'rgba(212,175,55,0)'),
      color: 0xf0cf65,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.backGlow = new THREE.Sprite(this.backGlowMat);
    this.backGlow.position.set(0, 1.55, -8.6);
    this.backGlow.scale.set(14, 14, 1);

    // A second, hotter glow precisely behind her face — when her smile cutout
    // shows, this is the gold that shines through. Its opacity rises with
    // chapter progress.
    this.faceGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(255,235,180,1)', 'rgba(255,200,90,0)'),
      color: 0xffe4a8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.faceGlow = new THREE.Sprite(this.faceGlowMat);
    this.faceGlow.position.set(0.45, 2.18, -6.45); // behind Daisy's head
    this.faceGlow.scale.set(2.2, 2.2, 1);

    // ---- Daisy: 2D silhouette ----
    // The body is on its own subgroup so the whole figure can sway.
    this.figure = new THREE.Group();
    this.figure.position.set(0.45, 1.0, -6.0);
    this.figure.rotation.y = 0;

    const bodyTex = this._makeDaisyBodyTexture();
    this.bodyMat = new THREE.MeshBasicMaterial({
      map: bodyTex,
      color: 0x000000,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.body = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.6), this.bodyMat);
    this.body.position.set(0, 0.6, 0);

    // Waving arm — separate plane, pivoted at the right shoulder so it can
    // rotate freely without distorting the body silhouette.
    const armTex = this._makeDaisyArmTexture();
    this.armMat = new THREE.MeshBasicMaterial({
      map: armTex,
      color: 0x000000,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.armPivot = new THREE.Group();
    // Right shoulder of the silhouette in figure-local coords.
    this.armPivot.position.set(0.32, 1.55, 0.01);
    this.arm = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.05), this.armMat);
    // Anchor the arm so the pivot is at its TOP (shoulder), and it hangs down.
    this.arm.position.set(0, -0.46, 0);
    this.armPivot.add(this.arm);

    // ---- Cream / gold motion trails behind her — the dream's blur ----
    this.trails = new THREE.Group();
    this.trailMaterials = [];
    for (let i = 0; i < 4; i += 1) {
      const trailGeo = new THREE.PlaneGeometry(1.1 + i * 0.18, 2.9 + i * 0.18, 12, 18);
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
        blending: THREE.AdditiveBlending,
      });
      const trail = new THREE.Mesh(trailGeo, mat);
      trail.position.set(-0.18 + i * 0.13, 0.42 - i * 0.05, -0.55 - i * 0.34);
      trail.rotation.y = -0.16 + i * 0.1;
      trail.userData.seed = Math.random() * Math.PI * 2;
      trail.userData.basePosition = trail.position.clone();
      this.trailMaterials.push(mat);
      this.trails.add(trail);
    }

    this.dust = this._makeDust();

    this.figure.add(this.trails, this.body, this.armPivot);

    this.group.add(
      this.ambient,
      this.keyLight,
      this.greenFill,
      this.backGlow,
      this.faceGlow,
      this.figure,
      this.dust,
    );
    this.group.visible = false;
    scene.add(this.group);
  }

  // ----- Daisy's body silhouette: pure black, distinctly a 1920s woman.
  //       Bob hair with side curls, defined bust + cinched waist + hip flare,
  //       long pearl necklace, eyelash flicks, and a small bow in the hair.
  //       Smile + eyes are punched OUT so the warm gold behind shows through. -----
  _makeDaisyBodyTexture() {
    const W = 256;
    const H = 512;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';

    const cx = W / 2;

    // ---------- Hair (bob with side curls, slight finger-wave shape) ----------
    ctx.beginPath();
    // Top crown
    ctx.moveTo(cx - 68, H * 0.165);
    ctx.bezierCurveTo(
      cx - 80, H * 0.075,  cx + 80, H * 0.075,  cx + 68, H * 0.165,
    );
    // Right side curl flicking outward at the cheek
    ctx.bezierCurveTo(
      cx + 84, H * 0.190,  cx + 84, H * 0.250,  cx + 60, H * 0.272,
    );
    // Inward tuck up to jaw
    ctx.lineTo(cx + 30, H * 0.270);
    // Chin curve
    ctx.bezierCurveTo(
      cx + 20, H * 0.300,  cx - 20, H * 0.300,  cx - 30, H * 0.270,
    );
    // Left jaw
    ctx.lineTo(cx - 60, H * 0.272);
    // Left side curl
    ctx.bezierCurveTo(
      cx - 84, H * 0.250,  cx - 84, H * 0.190,  cx - 68, H * 0.165,
    );
    ctx.closePath();
    ctx.fill();

    // ---------- Neck (slim) ----------
    ctx.fillRect(cx - 10, H * 0.295, 20, 22);

    // ---------- Body: bust → cinched waist → flared dress ----------
    ctx.beginPath();
    // Right shoulder
    ctx.moveTo(cx + 52, H * 0.320);
    // Bust curve out
    ctx.bezierCurveTo(
      cx + 78, H * 0.355,
      cx + 80, H * 0.430,
      cx + 60, H * 0.460,
    );
    // Pull in to narrow waist
    ctx.bezierCurveTo(
      cx + 50, H * 0.485,
      cx + 38, H * 0.510,
      cx + 36, H * 0.555,
    );
    // Hip flare into long dress
    ctx.bezierCurveTo(
      cx + 50, H * 0.610,
      cx + 86, H * 0.760,
      cx + 110, H * 0.985,
    );
    // Hem (full width)
    ctx.lineTo(cx - 110, H * 0.985);
    // Mirror left
    ctx.bezierCurveTo(
      cx - 86, H * 0.760,
      cx - 50, H * 0.610,
      cx - 36, H * 0.555,
    );
    ctx.bezierCurveTo(
      cx - 38, H * 0.510,
      cx - 50, H * 0.485,
      cx - 60, H * 0.460,
    );
    ctx.bezierCurveTo(
      cx - 80, H * 0.430,
      cx - 78, H * 0.355,
      cx - 52, H * 0.320,
    );
    ctx.closePath();
    ctx.fill();

    // ---------- Left arm down at her side ----------
    ctx.beginPath();
    ctx.moveTo(cx - 60, H * 0.330);
    ctx.bezierCurveTo(
      cx - 80, H * 0.420,
      cx - 90, H * 0.500,
      cx - 80, H * 0.580,
    );
    // Hand
    ctx.bezierCurveTo(
      cx - 70, H * 0.605,
      cx - 60, H * 0.605,
      cx - 64, H * 0.580,
    );
    ctx.bezierCurveTo(
      cx - 70, H * 0.500,
      cx - 60, H * 0.420,
      cx - 50, H * 0.330,
    );
    ctx.closePath();
    ctx.fill();

    // ---------- Heels peeking under the dress hem ----------
    ctx.beginPath();
    ctx.moveTo(cx - 22, H * 0.985);
    ctx.lineTo(cx - 16, H * 1.000);
    ctx.lineTo(cx - 6,  H * 0.985);
    ctx.closePath();
    ctx.moveTo(cx + 22, H * 0.985);
    ctx.lineTo(cx + 16, H * 1.000);
    ctx.lineTo(cx + 6,  H * 0.985);
    ctx.closePath();
    ctx.fill();

    // ---------- CUTOUTS — face features + pearls + bow accent ----------
    ctx.globalCompositeOperation = 'destination-out';

    // Eyes — almond shape, pulled slightly upward with a gentle lash flick
    ctx.beginPath();
    ctx.ellipse(cx - 13, H * 0.218, 5.2, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 13, H * 0.218, 5.2, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lash flicks at the outer corners
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(cx - 18, H * 0.219);
    ctx.lineTo(cx - 23, H * 0.213);
    ctx.moveTo(cx + 18, H * 0.219);
    ctx.lineTo(cx + 23, H * 0.213);
    ctx.stroke();

    // Smile — fuller curved lips
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, H * 0.255, 13, 0.20, Math.PI - 0.20);
    ctx.stroke();

    // Pearl necklace — a gentle U arc of tiny round cutouts across the chest
    for (let i = -5; i <= 5; i += 1) {
      const x = cx + i * 7;
      const y = H * 0.330 + Math.abs(i) * 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // Long sautoir loop down to the waist
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.arc(cx - 1, H * (0.355 + i * 0.018), 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // A small bow/hair clip at the top of the head — two tiny triangles
    ctx.beginPath();
    ctx.moveTo(cx - 6,  H * 0.110);
    ctx.lineTo(cx - 18, H * 0.092);
    ctx.lineTo(cx - 18, H * 0.124);
    ctx.closePath();
    ctx.moveTo(cx + 6,  H * 0.110);
    ctx.lineTo(cx + 18, H * 0.092);
    ctx.lineTo(cx + 18, H * 0.124);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  // ----- The waving arm: a tapered black shape with a small palm at the
  //       end. Anchored so the texture's TOP center is the rotation pivot. -----
  _makeDaisyArmTexture() {
    const W = 64;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';

    // Upper arm + forearm — gentle taper
    ctx.beginPath();
    ctx.moveTo(W * 0.40, 0);
    ctx.lineTo(W * 0.34, H * 0.55);
    ctx.lineTo(W * 0.34, H * 0.90);
    ctx.lineTo(W * 0.66, H * 0.90);
    ctx.lineTo(W * 0.66, H * 0.55);
    ctx.lineTo(W * 0.60, 0);
    ctx.closePath();
    ctx.fill();

    // Palm — a small circle at the wrist end
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.93, W * 0.30, 0, Math.PI * 2);
    ctx.fill();

    // Faint fingers (a few small bumps so the palm reads)
    ctx.beginPath();
    ctx.arc(W * 0.5 - W * 0.12, H * 0.985, W * 0.06, 0, Math.PI * 2);
    ctx.arc(W * 0.5 + W * 0.0,  H * 1.00,  W * 0.06, 0, Math.PI * 2);
    ctx.arc(W * 0.5 + W * 0.12, H * 0.985, W * 0.06, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
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
    const I = this.intensity;
    const P = this.progress;

    this.ambient.intensity   = I * 0.46;
    this.keyLight.intensity  = I * (1.25 + P * 0.3);
    this.greenFill.intensity = I * (0.14 + P * 0.18);

    this.backGlowMat.opacity = I * (0.35 + P * 0.25 + Math.sin(t * 0.7) * 0.04);
    this.faceGlowMat.opacity = I * (0.55 + P * 0.30 + Math.sin(t * 1.6) * 0.05);

    // Daisy silhouette — fades in with the chapter
    this.bodyMat.opacity = I * 0.98;
    this.armMat.opacity  = I * 0.98;

    // Sway: she rocks gently, like someone calling across distance.
    this.figure.position.x = 0.45 + Math.sin(t * 0.20) * 0.06;
    this.figure.position.y = 1.00 + Math.sin(t * 0.32) * 0.04;
    this.figure.rotation.z = Math.sin(t * 0.18) * 0.025;
    this.body.rotation.z   = Math.sin(t * 0.45) * 0.012;

    // Wave: arm raised, oscillating side to side.
    // Base = arm raised up (≈ -1.35 rad ≈ 77°). Oscillation ±0.28 rad.
    const waveBase = -1.35;
    const waveOsc  = Math.sin(t * 4.4) * 0.28;
    // A little settle-in: as the chapter starts (P≈0) the wave is small,
    // and it grows as the chapter progresses, then steadies.
    const waveAmt  = 0.55 + Math.min(1, P * 1.6) * 0.45;
    this.armPivot.rotation.z = waveBase + waveOsc * waveAmt;
    // tiny forward tilt so the arm doesn't read flat
    this.armPivot.rotation.x = Math.sin(t * 0.9) * 0.04;

    // Cream/gold sweeping trails behind her
    this.trails.children.forEach((trail, index) => {
      const base = trail.userData.basePosition;
      const sway = Math.sin(t * (0.52 + index * 0.08) + trail.userData.seed);
      trail.position.x = base.x + sway * 0.07;
      trail.position.y = base.y + Math.cos(t * 0.4 + trail.userData.seed) * 0.04;
      trail.rotation.y = -0.16 + index * 0.1 + sway * 0.05;
      this.trailMaterials[index].opacity = I * (0.06 + index * 0.014 + P * 0.025);
    });

    this.dustUniforms.uTime.value = t;
    this.dustUniforms.uOpacity.value = I * (0.28 + P * 0.08);
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
