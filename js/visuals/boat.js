// "So we beat on, boats against the current, borne back ceaselessly into the past."
// A small boat on shader waves, drifting away into fog. The green light still
// burns on the horizon, smaller now — a memory.

import * as THREE from 'three';

export class BoatScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // --- Foggy water ---
    const waterGeo = new THREE.PlaneGeometry(120, 120, 180, 180);
    this.waterUniforms = {
      uTime:      { value: 0 },
      uColorDeep: { value: new THREE.Color(0x050a14) },
      uColorShallow: { value: new THREE.Color(0x0d1c2e) },
      uFogColor:  { value: new THREE.Color(0x0a1929) },
    };
    const waterMat = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float w  = sin(pos.x * 0.4 + uTime * 0.6) * 0.12;
                w += sin(pos.y * 0.55 + uTime * 0.9) * 0.09;
                w += sin((pos.x - pos.y) * 0.3 + uTime * 0.4) * 0.06;
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
        uniform vec3 uFogColor;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorldPos;
        void main() {
          vec3 col = mix(uColorDeep, uColorShallow, smoothstep(0.0, 1.0, vUv.y));
          // Highlight crests
          col += vec3(0.05, 0.07, 0.1) * smoothstep(0.05, 0.18, vWave);
          // Distance fog
          float d = length(vWorldPos.xz) * 0.04;
          float fogAmt = 1.0 - exp(-d);
          col = mix(col, uFogColor, fogAmt);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0;

    // --- Boat ---
    // Built from a hull shape (extruded) + a small mast & sail
    this.boat = new THREE.Group();

    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.0, 0);
    hullShape.bezierCurveTo(-1.1, -0.3, -0.6, -0.45, 0, -0.45);
    hullShape.bezierCurveTo( 0.6, -0.45,  1.1, -0.3,  1.0, 0);
    hullShape.lineTo(-1.0, 0);
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
    });
    hullGeo.translate(0, 0, -0.2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x14202c,
      roughness: 0.9,
      metalness: 0.1,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.x = -Math.PI / 2;

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8);
    const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({
      color: 0x1a1208, roughness: 0.8,
    }));
    mast.position.y = 0.55;

    // Sail (a slightly curved plane)
    const sailGeo = new THREE.PlaneGeometry(0.7, 1.0, 8, 8);
    // Subtle curve to the sail
    const sailPos = sailGeo.attributes.position;
    for (let i = 0; i < sailPos.count; i++) {
      const x = sailPos.getX(i);
      sailPos.setZ(i, -0.12 * (1 - (x / 0.35) ** 2));
    }
    sailPos.needsUpdate = true;
    sailGeo.computeVertexNormals();
    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc0,
      side: THREE.DoubleSide,
      roughness: 0.95,
    });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0.18, 0.75, 0);

    this.boat.add(hull, mast, sail);
    this.boat.position.set(2.5, 0.05, -3);
    this.boat.rotation.y = -0.4;
    this.boat.scale.setScalar(0.85);

    // --- Distant green light (smaller, mournful) ---
    const orbGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x4dffaa });
    this.farOrb = new THREE.Mesh(orbGeo, orbMat);
    this.farOrb.position.set(-3, 1.2, -28);
    const haloTex = this._radialTex('rgba(77,255,170,0.9)', 'rgba(77,255,170,0)');
    this.farHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.farHalo.scale.setScalar(4);
    this.farHalo.position.copy(this.farOrb.position);

    // --- Lighting ---
    this.moonLight = new THREE.DirectionalLight(0xb8c8e0, 0.7);
    this.moonLight.position.set(-3, 4, -2);
    this.ambient = new THREE.AmbientLight(0x223344, 0.4);

    // --- Soft fog particles drifting across ---
    this.fogParticles = this._makeFogParticles();

    // Heavy scene fog
    this.fog = new THREE.Fog(0x0a1929, 8, 38);

    this.group.add(this.water, this.boat, this.farHalo, this.farOrb,
                   this.moonLight, this.ambient, this.fogParticles);
    this.group.visible = false;
    scene.add(this.group);
  }

  _radialTex(c0, c1) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _makeFogParticles() {
    const COUNT = window.innerWidth < 720 ? 80 : 200;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i*3+0] = (Math.random() - 0.5) * 50;
      positions[i*3+1] = Math.random() * 4 + 0.3;
      positions[i*3+2] = -Math.random() * 30 - 1;
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));

    const tex = this._radialTex('rgba(180,200,220,0.35)', 'rgba(180,200,220,0)');
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uTex:  { value: tex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.2 + aSeed * 6.28) * 1.5 + uTime * 0.4 * (aSeed - 0.5);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (8.0 + aSeed * 16.0) * 30.0 * uPixelRatio / -mv.z;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(0.65, 0.72, 0.82, t.a * 0.5);
        }
      `,
    });
    this.fogUniforms = m.uniforms;
    return new THREE.Points(g, m);
  }

  show() {
    this.group.visible = true;
    // apply fog when active
    this._prevFog = this.scene.fog;
    this.scene.fog = this.fog;
  }
  hide() {
    this.group.visible = false;
    this.scene.fog = this._prevFog || null;
  }

  update(t) {
    if (!this.group.visible) return;
    this.waterUniforms.uTime.value = t;
    this.fogUniforms.uTime.value = t;

    // Boat bobs and slowly recedes
    this.boat.position.y = 0.05 + Math.sin(t * 0.9) * 0.07;
    this.boat.rotation.z = Math.sin(t * 0.8) * 0.05;
    this.boat.rotation.x = Math.sin(t * 0.7 + 0.4) * 0.03;
    // very slow drift outward
    this.boat.position.x = 2.5 + Math.sin(t * 0.1) * 0.4;

    // Pulse the distant orb
    const pulse = 0.92 + Math.sin(t * 1.4) * 0.08;
    this.farOrb.scale.setScalar(pulse);
    this.farHalo.scale.setScalar(4 * pulse);
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
