// Art Deco shapes for "Daisy" — the dream, the polished memory.
// Gold rings, sunbursts, and diamonds rotating against a velvet dark.
// Inspired by 1920s jewelry and the geometry of Jazz Age glamour.

import * as THREE from 'three';

export class ArtDecoScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Soft directional lighting so metals catch a highlight
    this.keyLight = new THREE.DirectionalLight(0xfff4d0, 1.4);
    this.keyLight.position.set(5, 6, 8);
    this.fillLight = new THREE.DirectionalLight(0x4dffaa, 0.25);
    this.fillLight.position.set(-6, -2, 4);
    this.ambient = new THREE.AmbientLight(0x223344, 0.4);

    // Material: warm gold, metallic
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.28,
      emissive: 0x2a1f08,
    });

    // --- Central tiered ring stack (like a Deco brooch) ---
    this.brooch = new THREE.Group();
    const ringRadii = [1.6, 1.25, 0.9, 0.6];
    ringRadii.forEach((r, i) => {
      const g = new THREE.TorusGeometry(r, 0.04 + i * 0.012, 24, 96);
      const m = new THREE.Mesh(g, goldMat);
      this.brooch.add(m);
    });

    // Inner cabochon (a small green "Daisy" jewel)
    const jewelGeo = new THREE.SphereGeometry(0.22, 32, 32);
    const jewelMat = new THREE.MeshStandardMaterial({
      color: 0x1fb87a,
      metalness: 0.4,
      roughness: 0.15,
      emissive: 0x0a4d33,
      emissiveIntensity: 0.7,
    });
    this.jewel = new THREE.Mesh(jewelGeo, jewelMat);
    this.brooch.add(this.jewel);

    // Sunburst rays radiating outward (thin extruded shards)
    const rayShape = new THREE.Shape();
    rayShape.moveTo(0, 0);
    rayShape.lineTo(0.06, 0.04);
    rayShape.lineTo(1.4, 0);
    rayShape.lineTo(0.06, -0.04);
    rayShape.lineTo(0, 0);
    const rayGeo = new THREE.ExtrudeGeometry(rayShape, {
      depth: 0.04, bevelEnabled: false,
    });
    const RAY_COUNT = 24;
    this.rays = new THREE.Group();
    for (let i = 0; i < RAY_COUNT; i++) {
      const r = new THREE.Mesh(rayGeo, goldMat);
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      r.rotation.z = angle;
      r.position.x = Math.cos(angle) * 1.7;
      r.position.y = Math.sin(angle) * 1.7;
      this.rays.add(r);
    }
    this.brooch.add(this.rays);

    this.brooch.position.set(0, 1.5, -6);

    // --- Floating diamonds in the foreground/background ---
    this.diamonds = new THREE.Group();
    const diaGeo = new THREE.OctahedronGeometry(0.25, 0);
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(diaGeo, goldMat);
      d.position.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8 + 1.5,
        -3 - Math.random() * 8,
      );
      d.userData.seed = Math.random() * Math.PI * 2;
      d.userData.spin = (Math.random() - 0.5) * 0.6;
      d.userData.baseY = d.position.y;
      d.scale.setScalar(0.5 + Math.random() * 0.9);
      this.diamonds.add(d);
    }

    // --- Vertical Deco columns (chevron motifs) on the sides ---
    this.columns = new THREE.Group();
    const chevShape = new THREE.Shape();
    chevShape.moveTo(0, 0);
    chevShape.lineTo(0.4, 0.2);
    chevShape.lineTo(0, 0.4);
    chevShape.lineTo(-0.4, 0.2);
    chevShape.lineTo(0, 0);
    const chevGeo = new THREE.ExtrudeGeometry(chevShape, {
      depth: 0.05, bevelEnabled: false,
    });
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(chevGeo, goldMat);
        c.position.set(side * 5.2, -2 + i * 0.65, -7);
        c.scale.setScalar(0.9);
        this.columns.add(c);
      }
    }

    this.group.add(this.ambient, this.keyLight, this.fillLight,
                   this.brooch, this.diamonds, this.columns);
    this.group.visible = false;
    scene.add(this.group);
  }

  show() { this.group.visible = true; }
  hide() { this.group.visible = false; }

  update(t) {
    if (!this.group.visible) return;
    this.brooch.rotation.z = t * 0.15;
    this.rays.rotation.z = -t * 0.08;
    // Subtle "breathing"
    const breathe = 1 + Math.sin(t * 0.8) * 0.025;
    this.brooch.scale.setScalar(breathe);
    // Jewel pulse
    this.jewel.material.emissiveIntensity = 0.6 + Math.sin(t * 1.6) * 0.25;

    this.diamonds.children.forEach(d => {
      d.rotation.x = t * d.userData.spin;
      d.rotation.y = t * d.userData.spin * 0.7;
      d.position.y = d.userData.baseY + Math.sin(t * 0.5 + d.userData.seed) * 0.4;
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
