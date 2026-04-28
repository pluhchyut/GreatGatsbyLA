// "So we beat on..." The last chapter widens the frame and lets the motion
// feel lonelier, but the final light now has a real payoff on the horizon:
// a stronger orb, a soft atmospheric bloom, and a broken reflection lane.

import * as THREE from 'three';

export class BoatScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    const waterGeo = new THREE.PlaneGeometry(120, 120, 56, 56);
    this.waterUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uProgress: { value: 0 },
      uColorDeep: { value: new THREE.Color(0x050a14) },
      uColorShallow: { value: new THREE.Color(0x0d1c2e) },
      uFogColor: { value: new THREE.Color(0x0a1929) },
    };
    this.waterMat = new THREE.ShaderMaterial({
      transparent: true,
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
          float w = sin(pos.x * 0.22 + uTime * 0.34) * 0.07;
          w += sin(pos.y * 0.28 + uTime * 0.42) * 0.05;
          w += sin((pos.x - pos.y) * 0.16 + uTime * 0.26) * 0.035 * (0.65 + uProgress * 0.35);
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
        uniform float uOpacity;
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorldPos;
        void main() {
          vec3 col = mix(uColorDeep, uColorShallow, smoothstep(0.0, 1.0, vUv.y));
          float ripple = sin(vUv.y * 96.0 - uTime * 1.1) * sin(vUv.x * 28.0 + uTime * 0.45);
          float glint = smoothstep(0.76, 1.0, ripple) * (0.05 + uProgress * 0.07);
          col += vec3(0.05, 0.08, 0.1) * smoothstep(0.02, 0.12, vWave);
          col += vec3(0.28, 0.55, 0.48) * glint;
          float distFog = 1.0 - exp(-length(vWorldPos.xz) * 0.04);
          col = mix(col, uFogColor, distFog);
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
    this.water = new THREE.Mesh(waterGeo, this.waterMat);
    this.water.rotation.x = -Math.PI / 2;

    this.boat = new THREE.Group();
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-1.0, 0);
    hullShape.bezierCurveTo(-1.1, -0.3, -0.6, -0.45, 0, -0.45);
    hullShape.bezierCurveTo(0.6, -0.45, 1.1, -0.3, 1.0, 0);
    hullShape.lineTo(-1.0, 0);
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
    });
    hullGeo.translate(0, 0, -0.2);
    this.hullMat = new THREE.MeshStandardMaterial({
      color: 0x14202c,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
    });
    const hull = new THREE.Mesh(hullGeo, this.hullMat);
    hull.rotation.x = -Math.PI / 2;

    this.mastMat = new THREE.MeshStandardMaterial({
      color: 0x1a1208,
      roughness: 0.8,
      transparent: true,
      opacity: 0,
    });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), this.mastMat);
    mast.position.y = 0.55;

    const sailGeo = new THREE.PlaneGeometry(0.7, 1.0, 8, 8);
    const sailPos = sailGeo.attributes.position;
    for (let i = 0; i < sailPos.count; i += 1) {
      const x = sailPos.getX(i);
      sailPos.setZ(i, -0.12 * (1 - (x / 0.35) ** 2));
    }
    sailPos.needsUpdate = true;
    sailGeo.computeVertexNormals();
    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc0,
      side: THREE.DoubleSide,
      roughness: 0.95,
      transparent: true,
      opacity: 0,
    });
    const sail = new THREE.Mesh(sailGeo, this.sailMat);
    sail.position.set(0.18, 0.75, 0);

    this.boat.add(hull, mast, sail);
    this.boat.position.set(2.5, 0.05, -3);
    this.boat.rotation.y = -0.4;
    this.boat.scale.setScalar(0.85);

    this.wakeMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(180,200,220,0.4)', 'rgba(180,200,220,0)'),
      color: 0x9fb8cf,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.wake = new THREE.Sprite(this.wakeMat);
    this.wake.scale.set(4.8, 2.0, 1);
    this.wake.position.set(1.4, 0.06, -2.8);

    const shorelineGeo = new THREE.PlaneGeometry(40, 2.2);
    this.shorelineMat = new THREE.MeshBasicMaterial({
      color: 0x07111a,
      transparent: true,
      opacity: 0,
    });
    this.shoreline = new THREE.Mesh(shorelineGeo, this.shorelineMat);
    this.shoreline.position.set(0, 0.95, -30);

    const orbGeo = new THREE.SphereGeometry(0.24, 28, 28);
    this.farOrbMat = new THREE.MeshBasicMaterial({
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      fog: false,
    });
    this.farOrb = new THREE.Mesh(orbGeo, this.farOrbMat);
    this.farOrb.position.set(-2.2, 1.34, -24.5);
    const haloTex = this._radialTex('rgba(77,255,170,0.9)', 'rgba(77,255,170,0)');
    this.farHaloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.farHalo = new THREE.Sprite(this.farHaloMat);
    this.farHalo.scale.setScalar(6.2);
    this.farHalo.position.copy(this.farOrb.position);

    this.pinLightMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(255,255,255,0.98)', 'rgba(255,255,255,0)'),
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.pinLight = new THREE.Sprite(this.pinLightMat);
    this.pinLight.position.copy(this.farOrb.position);
    this.pinLight.scale.set(1.1, 1.1, 1);

    this.horizonGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(77,255,170,0.65)', 'rgba(77,255,170,0)'),
      color: 0x5effb8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.horizonGlow = new THREE.Sprite(this.horizonGlowMat);
    this.horizonGlow.position.set(-2.15, 1.24, -24.8);
    this.horizonGlow.scale.set(13.5, 8.2, 1);

    this.reflectionMat = new THREE.MeshBasicMaterial({
      map: this._reflectionTex(),
      color: 0x7affcd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.reflection = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12.5), this.reflectionMat);
    this.reflection.rotation.x = -Math.PI / 2;
    this.reflection.position.set(-2.1, 0.045, -17.8);

    this.moonLight = new THREE.DirectionalLight(0xb8c8e0, 0);
    this.moonLight.position.set(-3, 4, -2);
    this.ambient = new THREE.AmbientLight(0x223344, 0);

    this.fogParticles = this._makeFogParticles();
    this.fog = new THREE.Fog(0x0a1929, 8, 38);

    this.group.add(
      this.water,
      this.shoreline,
      this.wake,
      this.boat,
      this.reflection,
      this.horizonGlow,
      this.pinLight,
      this.farHalo,
      this.farOrb,
      this.moonLight,
      this.ambient,
      this.fogParticles,
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

  _reflectionTex() {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.18, 'rgba(180,255,223,0.55)');
    grad.addColorStop(0.52, 'rgba(107,255,189,0.16)');
    grad.addColorStop(1, 'rgba(107,255,189,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  _makeFogParticles() {
    const count = window.innerWidth < 720 ? 80 : 200;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 4 + 0.3;
      positions[i * 3 + 2] = -Math.random() * 30 - 1;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const tex = this._radialTex('rgba(180,200,220,0.35)', 'rgba(180,200,220,0)');
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uTex: { value: tex },
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.18 + aSeed * 6.28) * 1.1;
          p.x += (fract(uTime * 0.035 + aSeed) - 0.5) * 7.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (8.0 + aSeed * 16.0) * 30.0 * uPixelRatio / -mv.z;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(0.65, 0.72, 0.82, tex.a * 0.5 * uOpacity);
        }
      `,
    });
    this.fogUniforms = mat.uniforms;
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

    this.waterUniforms.uTime.value = t;
    this.waterUniforms.uOpacity.value = this.intensity;
    this.waterUniforms.uProgress.value = this.progress;
    this.fogUniforms.uTime.value = t;
    this.fogUniforms.uOpacity.value = this.intensity;

    this.hullMat.opacity = this.intensity;
    this.mastMat.opacity = this.intensity;
    this.sailMat.opacity = this.intensity * 0.96;
    this.wakeMat.opacity = this.intensity * (0.16 + this.progress * 0.14);
    this.shorelineMat.opacity = this.intensity * 0.75;
    const endPhase = smoothstepLocal(0.62, 1.0, this.progress);
    const blink = smoothstepLocal(-0.45, 0.95, Math.sin(t * 4.4));
    const blinkGlow = endPhase * blink;

    this.farOrbMat.opacity = this.intensity * Math.min(1, 0.72 + this.progress * 0.28 + blinkGlow * 0.55);
    this.pinLightMat.opacity = this.intensity * Math.min(1, 0.18 + this.progress * 0.34 + blinkGlow * 0.72);
    this.farHaloMat.opacity = this.intensity * Math.min(1, 0.38 + this.progress * 0.34 + blinkGlow * 0.5);
    this.horizonGlowMat.opacity = this.intensity * (0.12 + this.progress * 0.42 + blinkGlow * 0.26);
    this.reflectionMat.opacity = this.intensity * (0.1 + this.progress * 0.34 + blinkGlow * 0.24);
    this.moonLight.intensity = this.intensity * 0.74;
    this.ambient.intensity = this.intensity * 0.42;

    this.boat.position.y = 0.05 + Math.sin(t * 0.9) * 0.07;
    this.boat.rotation.z = Math.sin(t * 0.8) * 0.05;
    this.boat.rotation.x = Math.sin(t * 0.7 + 0.4) * 0.03;
    this.boat.position.x = 2.5 + Math.sin(t * 0.1) * 0.4 - this.progress * 0.28;

    this.wake.position.x = this.boat.position.x - 1.15;
    this.wake.position.y = 0.08 + Math.sin(t * 0.9 + 0.6) * 0.03;
    this.wake.scale.set(4.6 + this.progress * 1.1, 1.8 + this.progress * 0.6, 1);

    const pulse = 0.96 + Math.sin(t * 1.35) * 0.06 + this.progress * 0.12 + blinkGlow * 0.18;
    this.farOrb.scale.setScalar(pulse * 0.7);
    this.pinLight.scale.setScalar(1.0 + this.progress * 1.2 + blinkGlow * 1.05);
    this.farHalo.scale.setScalar((5.8 + this.progress * 2.5 + blinkGlow * 1.8) * pulse);
    this.horizonGlow.scale.set(12.8 + this.progress * 6.0 + blinkGlow * 3.0, 7.8 + this.progress * 2.8 + blinkGlow * 1.4, 1);
    this.horizonGlow.position.y = 1.24 + Math.sin(t * 0.7) * 0.03;
    this.reflection.scale.set(1.0 + this.progress * 0.75, 1.0 + this.progress * 0.38, 1);
    this.reflection.position.x = this.farOrb.position.x + Math.sin(t * 0.22) * 0.04;
    this.reflection.position.z = -17.8 + this.progress * 1.6;
    this.pinLight.position.copy(this.farOrb.position);

    this.fog.near = 8;
    this.fog.far = 38 - this.progress * 4.0;
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

function smoothstepLocal(min, max, value) {
  const x = THREE.MathUtils.clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
}
