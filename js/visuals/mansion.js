// Gatsby's mansion: a vast silhouette across the night, every window lit,
// every room empty. Built from extruded shapes so it reads as a "great house"
// rather than a generic box — towers, gables, a long colonnade.

import * as THREE from 'three';

export class MansionScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // --- Starfield ---
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] =  Math.random() * 30 + 4;
      starPos[i * 3 + 2] = -30 - Math.random() * 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xfff4d0,
      size: 0.06,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(starGeo, starMat);

    // --- Moon ---
    const moonGeo = new THREE.CircleGeometry(1.6, 48);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf4e9d8 });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.position.set(-9, 9, -25);

    const moonHaloTex = this._radialTex('rgba(244,233,216,0.9)', 'rgba(244,233,216,0)');
    this.moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: moonHaloTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.moonHalo.scale.setScalar(7);
    this.moonHalo.position.copy(this.moon.position);

    // --- Mansion silhouette built from a 2D shape ---
    // We model a long manor: central tower with cupola, two flanking wings.
    const shape = new THREE.Shape();
    // start at left ground
    shape.moveTo(-9, 0);
    // left wing
    shape.lineTo(-9, 1.4);
    shape.lineTo(-7.2, 1.4);
    shape.lineTo(-7.2, 2.0);
    shape.lineTo(-5.4, 2.0);
    shape.lineTo(-5.4, 1.4);
    shape.lineTo(-4.0, 1.4);
    // central block rises
    shape.lineTo(-4.0, 2.4);
    shape.lineTo(-2.6, 2.4);
    // central tower
    shape.lineTo(-2.6, 3.6);
    shape.lineTo(-1.6, 3.6);
    // cupola peak
    shape.lineTo(-1.6, 4.0);
    shape.lineTo(-1.2, 4.0);
    shape.lineTo(-0.9, 4.6); // peak rising
    shape.lineTo(-0.6, 5.1);
    shape.lineTo(-0.3, 5.4); // tip
    shape.lineTo(0.0, 5.6);
    shape.lineTo(0.3, 5.4);
    shape.lineTo(0.6, 5.1);
    shape.lineTo(0.9, 4.6);
    shape.lineTo(1.2, 4.0);
    shape.lineTo(1.6, 4.0);
    shape.lineTo(1.6, 3.6);
    // mirror right side
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

    const mansionGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.0,
      bevelEnabled: false,
    });
    mansionGeo.translate(0, 0, -1.0); // center on z
    const mansionMat = new THREE.MeshBasicMaterial({ color: 0x010306 });
    this.mansion = new THREE.Mesh(mansionGeo, mansionMat);
    this.mansion.position.set(0, 0.3, -14);

    // --- Lit windows (small glowing rectangles in front of the silhouette) ---
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
        opacity: 0.75 + bright * 0.25,
      });
      const win = new THREE.Mesh(wg, wm);
      win.position.set(x, y + 0.05, -13.0); // in front of mansion
      win.userData.bright = bright;
      win.userData.seed = Math.random() * Math.PI * 2;
      this.windows.add(win);
      this.windowMeshes.push(win);
    });

    // Warm glow halo over the whole mansion
    const glowTex = this._radialTex('rgba(240,207,101,0.5)', 'rgba(240,207,101,0)');
    this.mansionGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.mansionGlow.scale.set(28, 16, 1);
    this.mansionGlow.position.set(0, 1.8, -13.5);

    // --- Ground/lawn (a dark plane) ---
    const lawnGeo = new THREE.PlaneGeometry(60, 40);
    const lawnMat = new THREE.MeshBasicMaterial({ color: 0x030608 });
    this.lawn = new THREE.Mesh(lawnGeo, lawnMat);
    this.lawn.rotation.x = -Math.PI / 2;
    this.lawn.position.y = 0.0;
    this.lawn.position.z = -8;

    this.group.add(
      this.stars, this.moonHalo, this.moon,
      this.mansionGlow, this.mansion, this.windows, this.lawn,
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

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t) {
    if (!this.group.visible) return;
    // Window flicker — each window pulses independently, hinting at parties inside
    this.windowMeshes.forEach(w => {
      const flick = 0.85 + Math.sin(t * 1.4 + w.userData.seed) * 0.15
                  + (Math.random() < 0.005 ? -0.4 : 0);
      w.material.opacity = (0.6 + w.userData.bright * 0.4) * flick;
    });
    // Star twinkle
    this.stars.material.opacity = 0.75 + Math.sin(t * 0.8) * 0.1;
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
