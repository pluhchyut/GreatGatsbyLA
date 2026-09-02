// Gatsby's parties: drifting gold confetti, champagne sparkle, jazz dust.
// Layered motion: a slow swirl, a fast jitter, lateral drift, plus paper
// lanterns swaying overhead.

import * as THREE from 'three';

export class GoldParticlesScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    const isMobile = window.innerWidth < 720;
    const COUNT = isMobile ? 900 : 2400;
    this.count = COUNT;

    const positions = new Float32Array(COUNT * 3);
    const seeds     = new Float32Array(COUNT);
    const sizes     = new Float32Array(COUNT);
    const tints     = new Float32Array(COUNT);
    const speeds    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = Math.random() * 22 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 5;
      seeds[i]  = Math.random() * Math.PI * 2;
      sizes[i]  = Math.random() * 0.55 + 0.18;
      tints[i]  = Math.random();
      speeds[i] = 0.6 + Math.random() * 0.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTint',    new THREE.BufferAttribute(tints, 1));
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1));

    const tex = this._sparkleTexture();

    this.uniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uTex:  { value: tex },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader: `
        attribute float aSeed;
        attribute float aSize;
        attribute float aTint;
        attribute float aSpeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTint;
        varying float vAlpha;
        varying float vSpark;
        void main() {
          vec3 p = position;
          // Lifecycle: each particle drifts up and resets after a stride
          float life = mod(uTime * aSpeed * 0.45 + aSeed * 0.7, 1.0);
          p.y = -4.0 + life * 22.0;
          // Layered swirl: slow lateral wave + fast jitter
          float seed = aSeed;
          p.x += sin(uTime * 0.55 + seed)             * 1.2
              +  sin(uTime * 2.3  + seed * 4.1)        * 0.18;
          p.z += cos(uTime * 0.45 + seed * 1.3)        * 0.9
              +  cos(uTime * 2.1  + seed * 3.7)        * 0.15;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          // Random "sparkle" twinkle
          float spark = 0.6 + 0.4 * sin(uTime * 5.5 + seed * 7.0);
          gl_PointSize = aSize * 110.0 * spark * uPixelRatio / -mv.z;
          vTint  = aTint;
          vSpark = spark;
          vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.78, 1.0, life));
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying float vTint;
        varying float vAlpha;
        varying float vSpark;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          // Mix between bright gold and warm cream
          vec3 gold  = vec3(0.94, 0.78, 0.32);
          vec3 cream = vec3(1.0,  0.93, 0.78);
          vec3 col = mix(gold, cream, vTint);
          col *= 0.85 + vSpark * 0.4;
          gl_FragColor = vec4(col, t.a * vAlpha * 0.95 * uOpacity);
        }
      `,
    });

    this.points = new THREE.Points(geo, mat);

    // --- Champagne bubbles — small clusters rising in narrow streams ---
    const BC = isMobile ? 250 : 600;
    const bp = new Float32Array(BC * 3);
    const bs = new Float32Array(BC);
    const STREAMS = 6;
    for (let i = 0; i < BC; i++) {
      const stream = i % STREAMS;
      const cx = -8 + stream * 3.4 + (Math.random() - 0.5) * 0.5;
      const cz = -3 + (Math.random() - 0.5) * 1.2;
      bp[i*3+0] = cx;
      bp[i*3+1] = -4 + Math.random() * 12;
      bp[i*3+2] = cz;
      bs[i] = Math.random() * Math.PI * 2;
    }
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    bgeo.setAttribute('aSeed',    new THREE.BufferAttribute(bs, 1));
    this.bubbleUniforms = {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    const bmat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: this.bubbleUniforms,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float life = mod(uTime * 0.6 + aSeed, 1.0);
          p.y = -4.0 + life * 10.0;
          p.x += sin(uTime * 1.2 + aSeed * 3.0) * 0.08;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.5 + sin(uTime * 4.0 + aSeed) * 0.6) * 22.0 * uPixelRatio / -mv.z;
          vAlpha = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.85, 1.0, life));
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.0, length(d));
          gl_FragColor = vec4(1.0, 0.95, 0.7, a * vAlpha * 0.7 * uOpacity);
        }
      `,
    });
    this.bubbles = new THREE.Points(bgeo, bmat);

    // --- Paper lanterns — rendered as glowing spheres + halo sprite +
    //     a thin string descending. They sway side-to-side independently. ---
    this.lanterns = new THREE.Group();
    this.lanternData = [];
    const lanternGlow = this._sparkleTexture();
    const COLORS = [0xf0cf65, 0xf4e9d8, 0xffc070, 0xe8a85c];
    const LCOUNT = isMobile ? 6 : 10;
    for (let i = 0; i < LCOUNT; i++) {
      const color = COLORS[i % COLORS.length];

      const lg = new THREE.SphereGeometry(0.22, 18, 18);
      const lm = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.92,
      });
      const l = new THREE.Mesh(lg, lm);
      const baseX = (Math.random() - 0.5) * 22;
      const baseY = Math.random() * 7 + 3;
      const baseZ = (Math.random() - 0.5) * 14 - 5;
      l.position.set(baseX, baseY, baseZ);
      this.lanterns.add(l);

      // Halo
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lanternGlow, color, transparent: true, opacity: 0.65,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      halo.scale.setScalar(2.6);
      halo.position.copy(l.position);
      this.lanterns.add(halo);

      // String — a thin extruded line from the lantern up to "the trees"
      const stringMat = new THREE.LineBasicMaterial({
        color: 0x6a5a30, transparent: true, opacity: 0.55,
      });
      const stringGeo = new THREE.BufferGeometry();
      stringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const string = new THREE.Line(stringGeo, stringMat);
      this.lanterns.add(string);

      this.lanternData.push({
        mesh: l, halo, string,
        baseX, baseY, baseZ,
        seed: Math.random() * Math.PI * 2,
        flickerSeed: Math.random() * Math.PI * 2,
      });
    }

    this.group.add(this.points, this.bubbles, this.lanterns);
    this.group.visible = false;
    scene.add(this.group);
  }

  _sparkleTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,220,140,0.9)');
    grad.addColorStop(0.6,  'rgba(212,175,55,0.25)');
    grad.addColorStop(1,    'rgba(212,175,55,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  setOpacity(a) {
    this._a = a;
    this.uniforms.uOpacity.value = a;
    this.bubbleUniforms.uOpacity.value = a;
    this.lanternData.forEach(d => {
      d.mesh.material.opacity   = 0.92 * a;
      d.halo.material.opacity   = 0.65 * a;
      d.string.material.opacity = 0.55 * a;
    });
  }

  update(t) {
    if (!this.group.visible) return;
    this.uniforms.uTime.value       = t;
    this.bubbleUniforms.uTime.value = t;

    this.lanternData.forEach(d => {
      // Sway side to side and bob up/down independently
      const sway  = Math.sin(t * 0.7 + d.seed) * 0.55;
      const bob   = Math.sin(t * 1.1 + d.seed * 1.7) * 0.18;
      const nx = d.baseX + sway;
      const ny = d.baseY + bob;
      const nz = d.baseZ + Math.cos(t * 0.5 + d.seed) * 0.12;
      d.mesh.position.set(nx, ny, nz);
      d.halo.position.set(nx, ny, nz);

      // String connects lantern to anchor at top of frame
      const ax = d.baseX + sway * 0.3; // anchor sways less
      const ay = d.baseY + 4.5;
      const az = d.baseZ;
      const arr = d.string.geometry.attributes.position.array;
      arr[0] = ax; arr[1] = ay; arr[2] = az;
      arr[3] = nx; arr[4] = ny; arr[5] = nz;
      d.string.geometry.attributes.position.needsUpdate = true;

      // Subtle warm flicker on opacity
      const flick = 0.85 + Math.sin(t * 4.0 + d.flickerSeed) * 0.12;
      d.mesh.material.opacity = 0.92 * (this._a ?? 1) * flick;
      d.halo.material.opacity = 0.65 * (this._a ?? 1) * flick;
    });
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
