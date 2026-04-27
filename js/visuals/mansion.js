// Gatsby's mansion: stately, overlit, and a little haunted.
// This scene favors architectural silhouette and believable, uneven window life
// rather than a flat blinking facade.

import * as THREE from 'three';

export class MansionScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = Math.random() * 30 + 4;
      starPos[i * 3 + 2] = -30 - Math.random() * 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xfff4d0,
      size: 0.06,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(starGeo, this.starMat);

    const skyTex = this._radialTex('rgba(24,38,62,0.9)', 'rgba(7,16,28,0)');
    this.skyGlowMat = new THREE.SpriteMaterial({
      map: skyTex,
      color: 0x314766,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.skyGlow = new THREE.Sprite(this.skyGlowMat);
    this.skyGlow.position.set(0, 9.5, -25);
    this.skyGlow.scale.set(44, 22, 1);

    const moonGeo = new THREE.CircleGeometry(1.6, 48);
    this.moonMat = new THREE.MeshBasicMaterial({
      color: 0xf4e9d8,
      transparent: true,
      opacity: 0,
    });
    this.moon = new THREE.Mesh(moonGeo, this.moonMat);
    this.moon.position.set(-9, 9, -25);

    const moonHaloTex = this._radialTex('rgba(244,233,216,0.9)', 'rgba(244,233,216,0)');
    this.moonHaloMat = new THREE.SpriteMaterial({
      map: moonHaloTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.moonHalo = new THREE.Sprite(this.moonHaloMat);
    this.moonHalo.scale.setScalar(7);
    this.moonHalo.position.copy(this.moon.position);

    const shape = new THREE.Shape();
    shape.moveTo(-9, 0);
    shape.lineTo(-9, 1.4);
    shape.lineTo(-7.2, 1.4);
    shape.lineTo(-7.2, 2.0);
    shape.lineTo(-5.4, 2.0);
    shape.lineTo(-5.4, 1.4);
    shape.lineTo(-4.0, 1.4);
    shape.lineTo(-4.0, 2.4);
    shape.lineTo(-2.6, 2.4);
    shape.lineTo(-2.6, 3.6);
    shape.lineTo(-1.6, 3.6);
    shape.lineTo(-1.6, 4.0);
    shape.lineTo(-1.2, 4.0);
    shape.lineTo(-0.9, 4.6);
    shape.lineTo(-0.6, 5.1);
    shape.lineTo(-0.3, 5.4);
    shape.lineTo(0.0, 5.6);
    shape.lineTo(0.3, 5.4);
    shape.lineTo(0.6, 5.1);
    shape.lineTo(0.9, 4.6);
    shape.lineTo(1.2, 4.0);
    shape.lineTo(1.6, 4.0);
    shape.lineTo(1.6, 3.6);
    shape.lineTo(2.6, 3.6);
    shape.lineTo(2.6, 2.4);
    shape.lineTo(4.0, 2.4);
    shape.lineTo(4.0, 1.4);
    shape.lineTo(5.4, 1.4);
    shape.lineTo(5.4, 2.0);
    shape.lineTo(7.2, 2.0);
    shape.lineTo(7.2, 1.4);
    shape.lineTo(9, 1.4);
    shape.lineTo(9, 0);
    shape.lineTo(-9, 0);

    const mansionGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: false });
    mansionGeo.translate(0, 0, -1.0);
    this.mansionMat = new THREE.MeshBasicMaterial({
      color: 0x010306,
      transparent: true,
      opacity: 0,
    });
    this.mansion = new THREE.Mesh(mansionGeo, this.mansionMat);
    this.mansion.position.set(0, 0.3, -14);

    this.windows = new THREE.Group();
    const windowDefs = [
      // [x, y, w, h, brightness 0-1]
      // left wing — row of small windows
      [-8.4, 0.9, 0.22, 0.32, 0.8], [-8.0, 0.9, 0.22, 0.32, 0.5],
      [-7.6, 0.9, 0.22, 0.32, 0.9], [-6.6, 0.9, 0.22, 0.32, 0.7],
      [-6.2, 0.9, 0.22, 0.32, 0.4], [-5.8, 0.9, 0.22, 0.32, 0.95],
      // left wing upper (inside the bump)
      [-6.6, 1.7, 0.2, 0.22, 0.9], [-6.0, 1.7, 0.2, 0.22, 0.6],
      // central block windows
      [-3.5, 0.9, 0.28, 0.42, 1.0], [-3.0, 0.9, 0.28, 0.42, 0.7],
      [-2.5, 0.9, 0.28, 0.42, 0.4], [-2.0, 0.9, 0.28, 0.42, 0.95],
      [-1.5, 0.9, 0.28, 0.42, 0.6], [-1.0, 0.9, 0.28, 0.42, 0.85],
      [-0.5, 0.9, 0.28, 0.42, 1.0], [ 0.0, 0.9, 0.28, 0.42, 0.5],
      [ 0.5, 0.9, 0.28, 0.42, 0.85], [ 1.0, 0.9, 0.28, 0.42, 0.95],
      [ 1.5, 0.9, 0.28, 0.42, 0.5], [ 2.0, 0.9, 0.28, 0.42, 0.9],
      [ 2.5, 0.9, 0.28, 0.42, 0.7], [ 3.0, 0.9, 0.28, 0.42, 1.0],
      [ 3.5, 0.9, 0.28, 0.42, 0.4],
      // central upper floor
      [-3.2, 1.7, 0.24, 0.32, 0.8], [-2.6, 1.7, 0.24, 0.32, 0.95],
      [-2.0, 1.7, 0.24, 0.32, 0.55], [-1.4, 1.7, 0.24, 0.32, 0.9],
      [-0.8, 1.7, 0.24, 0.32, 0.7], [-0.2, 1.7, 0.24, 0.32, 1.0],
      [ 0.4, 1.7, 0.24, 0.32, 0.6], [ 1.0, 1.7, 0.24, 0.32, 0.85],
      [ 1.6, 1.7, 0.24, 0.32, 0.95], [ 2.2, 1.7, 0.24, 0.32, 0.5],
      [ 2.8, 1.7, 0.24, 0.32, 0.9],
      // tower windows
      [-2.0, 2.7, 0.22, 0.32, 1.0], [-1.4, 2.7, 0.22, 0.32, 0.7],
      [ 1.2, 2.7, 0.22, 0.32, 0.9], [ 1.8, 2.7, 0.22, 0.32, 0.85],
      // tall central tower / cupola windows
      [-0.6, 3.1, 0.22, 0.5, 1.0], [ 0.4, 3.1, 0.22, 0.5, 0.95],
      // right wing mirror
      [ 5.8, 0.9, 0.22, 0.32, 0.85], [ 6.2, 0.9, 0.22, 0.32, 0.5],
      [ 6.6, 0.9, 0.22, 0.32, 0.95], [ 7.6, 0.9, 0.22, 0.32, 0.7],
      [ 8.0, 0.9, 0.22, 0.32, 0.4], [ 8.4, 0.9, 0.22, 0.32, 0.9],
      [ 6.0, 1.7, 0.2, 0.22, 0.7], [ 6.6, 1.7, 0.2, 0.22, 0.95],
    ];
    this.windowMeshes = [];
    windowDefs.forEach(([x, y, w, h, bright]) => {
      const wg = new THREE.PlaneGeometry(w, h);
      const wm = new THREE.MeshBasicMaterial({
        color: 0xf0cf65,
        transparent: true,
        opacity: 0,
      });
      const win = new THREE.Mesh(wg, wm);
      win.position.set(x, y + 0.05, -13.0);
      win.userData.bright = bright;
      win.userData.seed = Math.random() * Math.PI * 2;
      win.userData.currentDip = 1;
      win.userData.targetDip = 1;
      win.userData.nextShift = Math.random() * 1.4;
      this.windows.add(win);
      this.windowMeshes.push(win);
    });

    const glowTex = this._radialTex('rgba(240,207,101,0.5)', 'rgba(240,207,101,0)');
    this.mansionGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mansionGlow = new THREE.Sprite(this.mansionGlowMat);
    this.mansionGlow.scale.set(28, 16, 1);
    this.mansionGlow.position.set(0, 1.8, -13.5);

    const lawnGeo = new THREE.PlaneGeometry(60, 40);
    this.lawnMat = new THREE.MeshBasicMaterial({
      color: 0x030608,
      transparent: true,
      opacity: 0,
    });
    this.lawn = new THREE.Mesh(lawnGeo, this.lawnMat);
    this.lawn.rotation.x = -Math.PI / 2;
    this.lawn.position.z = -8;

    this.terraceLights = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const lamp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xf0cf65,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      lamp.scale.set(1.2, 1.2, 1);
      lamp.position.set(-5 + i * 2.0, 0.4 + (i % 2) * 0.05, -11.2);
      lamp.userData.seed = Math.random() * Math.PI * 2;
      this.terraceLights.add(lamp);
    }

    this.group.add(
      this.skyGlow,
      this.stars,
      this.moonHalo,
      this.moon,
      this.mansionGlow,
      this.mansion,
      this.windows,
      this.terraceLights,
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
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
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

    this.starMat.opacity = this.intensity * (0.58 + Math.sin(t * 0.45) * 0.05);
    this.skyGlowMat.opacity = this.intensity * 0.17;
    this.moonMat.opacity = this.intensity * 0.95;
    this.moonHaloMat.opacity = this.intensity * 0.36;
    this.mansionMat.opacity = this.intensity;
    this.mansionGlowMat.opacity = this.intensity * (0.18 + this.progress * 0.2);
    this.lawnMat.opacity = this.intensity * 0.96;

    this.windowMeshes.forEach((window) => {
      if (t > window.userData.nextShift) {
        window.userData.targetDip = Math.random() < 0.12 ? 0.42 + Math.random() * 0.22 : 1.0;
        window.userData.nextShift = t + 0.25 + Math.random() * 1.8;
      }

      window.userData.currentDip += (window.userData.targetDip - window.userData.currentDip) * 0.08;
      const flicker = 0.88 + Math.sin(t * 1.4 + window.userData.seed) * 0.12;
      const breath = 0.96 + Math.sin(t * 0.4 + window.userData.seed * 1.7) * 0.05;
      const opacity = (0.52 + window.userData.bright * 0.42) * flicker * breath * window.userData.currentDip;
      window.material.opacity = opacity * this.intensity;
    });

    this.terraceLights.children.forEach((lamp) => {
      lamp.material.opacity = this.intensity * (0.09 + Math.sin(t * 1.25 + lamp.userData.seed) * 0.03);
      lamp.scale.setScalar(1.1 + Math.sin(t * 0.9 + lamp.userData.seed) * 0.08);
    });

    this.moon.position.y = 9 + Math.sin(t * 0.12) * 0.2;
    this.moonHalo.position.copy(this.moon.position);
    this.group.position.x = Math.sin(t * 0.08) * 0.05;
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
