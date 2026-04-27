// Art Deco shapes for Daisy: glamorous, controlled, almost too polished.
// The motion should feel expensive and precise rather than noisy.

import * as THREE from 'three';

export class ArtDecoScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.intensity = 0;
    this.progress = 0;

    this.keyLight = new THREE.DirectionalLight(0xfff4d0, 0);
    this.keyLight.position.set(5, 6, 8);
    this.fillLight = new THREE.DirectionalLight(0x4dffaa, 0);
    this.fillLight.position.set(-6, -2, 4);
    this.ambient = new THREE.AmbientLight(0x223344, 0);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.28,
      emissive: 0x2a1f08,
      transparent: true,
      opacity: 0,
    });
    this.goldMaterials = [goldMat];

    this.backGlowMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(240,207,101,0.9)', 'rgba(240,207,101,0)'),
      color: 0x6f5a1f,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.backGlow = new THREE.Sprite(this.backGlowMat);
    this.backGlow.position.set(0, 1.5, -8.5);
    this.backGlow.scale.set(15, 15, 1);

    this.brooch = new THREE.Group();
    const ringRadii = [1.6, 1.25, 0.9, 0.6];
    ringRadii.forEach((radius, index) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.04 + index * 0.012, 24, 96),
        goldMat,
      );
      mesh.userData.depthOffset = index * 0.015;
      this.brooch.add(mesh);
    });

    const jewelGeo = new THREE.SphereGeometry(0.22, 32, 32);
    this.jewelMat = new THREE.MeshStandardMaterial({
      color: 0x1fb87a,
      metalness: 0.4,
      roughness: 0.15,
      emissive: 0x0a4d33,
      emissiveIntensity: 0.0,
      transparent: true,
      opacity: 0,
    });
    this.jewel = new THREE.Mesh(jewelGeo, this.jewelMat);
    this.brooch.add(this.jewel);

    this.jewelHaloMat = new THREE.SpriteMaterial({
      map: this._radialTex('rgba(77,255,170,0.95)', 'rgba(77,255,170,0)'),
      color: 0x4dffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.jewelHalo = new THREE.Sprite(this.jewelHaloMat);
    this.jewelHalo.scale.set(2.4, 2.4, 1);
    this.brooch.add(this.jewelHalo);

    const rayShape = new THREE.Shape();
    rayShape.moveTo(0, 0);
    rayShape.lineTo(0.06, 0.04);
    rayShape.lineTo(1.4, 0);
    rayShape.lineTo(0.06, -0.04);
    rayShape.lineTo(0, 0);
    const rayGeo = new THREE.ExtrudeGeometry(rayShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    const rayCount = 24;
    this.rays = new THREE.Group();
    for (let i = 0; i < rayCount; i += 1) {
      const ray = new THREE.Mesh(rayGeo, goldMat);
      const angle = (i / rayCount) * Math.PI * 2;
      ray.rotation.z = angle;
      ray.position.x = Math.cos(angle) * 1.7;
      ray.position.y = Math.sin(angle) * 1.7;
      this.rays.add(ray);
    }
    this.brooch.add(this.rays);
    this.brooch.position.set(0, 1.5, -6);

    this.diamonds = new THREE.Group();
    const diamondGeo = new THREE.OctahedronGeometry(0.25, 0);
    for (let i = 0; i < 14; i += 1) {
      const diamond = new THREE.Mesh(diamondGeo, goldMat);
      diamond.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8 + 1.5,
        -3 - Math.random() * 8,
      );
      diamond.userData.seed = Math.random() * Math.PI * 2;
      diamond.userData.spin = (Math.random() - 0.5) * 0.6;
      diamond.userData.baseY = diamond.position.y;
      diamond.userData.baseX = diamond.position.x;
      diamond.scale.setScalar(0.5 + Math.random() * 0.9);
      this.diamonds.add(diamond);
    }

    this.columns = new THREE.Group();
    const chevShape = new THREE.Shape();
    chevShape.moveTo(0, 0);
    chevShape.lineTo(0.4, 0.2);
    chevShape.lineTo(0, 0.4);
    chevShape.lineTo(-0.4, 0.2);
    chevShape.lineTo(0, 0);
    const chevGeo = new THREE.ExtrudeGeometry(chevShape, {
      depth: 0.05,
      bevelEnabled: false,
    });
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 9; i += 1) {
        const column = new THREE.Mesh(chevGeo, goldMat);
        column.position.set(side * 5.2, -2 + i * 0.65, -7);
        column.scale.setScalar(0.9);
        column.userData.seed = Math.random() * Math.PI * 2;
        this.columns.add(column);
      }
    }

    this.group.add(
      this.ambient,
      this.keyLight,
      this.fillLight,
      this.backGlow,
      this.brooch,
      this.diamonds,
      this.columns,
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

  setState({ intensity = 0, progress = 0 } = {}) {
    this.intensity = intensity;
    this.progress = progress;
    this.group.visible = intensity > 0.002;
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t) {
    if (!this.group.visible) return;

    this.keyLight.intensity = this.intensity * 1.45;
    this.fillLight.intensity = this.intensity * 0.35;
    this.ambient.intensity = this.intensity * 0.42;
    this.keyLight.position.x = 5 + Math.sin(t * 0.55) * 2.2;
    this.fillLight.position.y = -2 + Math.cos(t * 0.45) * 0.6;

    this.goldMaterials.forEach((material) => {
      material.opacity = this.intensity;
    });
    this.jewelMat.opacity = this.intensity;
    this.jewelMat.emissiveIntensity = this.intensity * (0.62 + Math.sin(t * 1.6) * 0.24);
    this.backGlowMat.opacity = this.intensity * (0.12 + this.progress * 0.18);
    this.jewelHaloMat.opacity = this.intensity * (0.26 + this.progress * 0.16);

    this.brooch.rotation.z = t * 0.15;
    this.rays.rotation.z = -t * 0.08;
    this.brooch.position.z = -6 + Math.sin(t * 0.35) * 0.08;
    this.brooch.scale.setScalar(1 + Math.sin(t * 0.8) * 0.025 + this.progress * 0.025);
    this.jewelHalo.scale.setScalar(2.1 + Math.sin(t * 1.2) * 0.12 + this.progress * 0.35);

    this.diamonds.children.forEach((diamond) => {
      diamond.rotation.x = t * diamond.userData.spin;
      diamond.rotation.y = t * diamond.userData.spin * 0.7;
      diamond.position.y = diamond.userData.baseY + Math.sin(t * 0.5 + diamond.userData.seed) * 0.42;
      diamond.position.x = diamond.userData.baseX + Math.cos(t * 0.3 + diamond.userData.seed) * 0.18;
    });

    this.columns.children.forEach((column, index) => {
      column.position.z = -7 + Math.sin(t * 0.65 + index * 0.2 + column.userData.seed) * 0.05;
    });
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
