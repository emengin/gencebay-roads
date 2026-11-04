import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { VEHICLES } from "./catalog.js";

export const PLATE_TEXT = "34 GENCEBAY 34";
function plateTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 236;
  const c = canvas.getContext("2d");
  c.fillStyle = "#f9f7eb";
  c.fillRect(0, 0, 1024, 236);
  c.strokeStyle = "#323735";
  c.lineWidth = 10;
  c.strokeRect(7, 7, 1010, 222);
  c.fillStyle = "#174b9e";
  c.fillRect(13, 13, 76, 210);
  c.fillStyle = "white";
  c.font = "bold 31px Arial";
  c.textAlign = "center";
  c.fillText("TR", 51, 188);
  c.fillStyle = "#171b1b";
  c.font = "bold 90px Arial";
  c.textBaseline = "middle";
  c.fillText(PLATE_TEXT, 550, 129, 875);
  c.fillStyle = "#7e8179";
  c.beginPath();
  c.arc(115, 115, 6, 0, Math.PI * 2);
  c.arc(986, 115, 6, 0, Math.PI * 2);
  c.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
// Longitudinal loft, with chamfered sections: genuine shaped bodywork rather than a box chassis.
function loft(stations, material, parent) {
  const vertices = [],
    indices = [];
  for (const [z, w, b, t] of stations) {
    const ring = [
      [-w * 0.83, b],
      [-w, b + 0.13],
      [-w, t - 0.11],
      [-w * 0.86, t],
      [w * 0.86, t],
      [w, t - 0.11],
      [w, b + 0.13],
      [w * 0.83, b],
    ];
    for (const [x, y] of ring) vertices.push(x, y, z);
  }
  for (let j = 0; j < stations.length - 1; j++)
    for (let k = 0; k < 8; k++) {
      let a = j * 8 + k,
        b = j * 8 + ((k + 1) % 8),
        c = a + 8,
        d = b + 8;
      indices.push(a, c, b, b, c, d);
    }
  for (let k = 1; k < 7; k++) {
    indices.push(0, k, k + 1);
    const a = (stations.length - 1) * 8;
    indices.push(a, a + k + 1, a + k);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function panel(points, material, parent) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points.flat(), 3),
  );
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  parent.add(mesh);
  return mesh;
}

export class VehicleModel {
  constructor(index, color) {
    this.spec = VEHICLES[index];
    this.index = index;
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.wheels = [];
    this.steerPivots = [];
    this.lamps = [];
    this.brakes = [];
    this.ownedTextures = [];
    const s = this.spec,
      w = s.width / 2,
      L = s.length / 2,
      base = s.radius * 0.72;
    this.paint = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.28,
      metalness: 0.38,
      clearcoat: 0.8,
      clearcoatRoughness: 0.28,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: s.retro ? "#b5b6ab" : "#242e2c",
      roughness: 0.42,
      metalness: s.retro ? 0.85 : 0.25,
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: "#bfc2ba",
      metalness: 0.85,
      roughness: 0.24,
    });
    const rubber = new THREE.MeshStandardMaterial({
      color: "#202625",
      roughness: 0.94,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#172425",
      roughness: 0.75,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#5d8184",
      roughness: 0.15,
      metalness: 0.45,
      transparent: true,
      opacity: 0.79,
      side: THREE.DoubleSide,
    });
    const tail = new THREE.MeshStandardMaterial({
      color: "#852e24",
      emissive: "#ff2c16",
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const head = new THREE.MeshStandardMaterial({
      color: "#e9dfb3",
      emissive: "#fff1c0",
      emissiveIntensity: 0.45,
      roughness: 0.19,
    });
    const box = (
      x,
      y,
      z,
      px,
      py,
      pz,
      mat = trim,
      round = 0.02,
      parent = this.body,
    ) => {
      const g = round
        ? new RoundedBoxGeometry(
            x,
            y,
            z,
            2,
            Math.min(round, x / 3, y / 3, z / 3),
          )
        : new THREE.BoxGeometry(x, y, z);
      const m = new THREE.Mesh(g, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    this.box = box;
    const top = base + (s.offroad ? 0.68 : index === 1 ? 0.4 : 0.58);
    this.belt = top;
    if (s.pickup) {
      loft(
        [
          [-L, w * 0.82, base + 0.05, top - 0.35],
          [-L + 0.24, w * 0.98, base, top - 0.31],
          [-L + 1, w, base, top - 0.3],
          [L - 0.75, w, base + 0.01, top - 0.3],
          [L, w * 0.78, base + 0.2, top - 0.3],
        ],
        this.paint,
        this.body,
      );
      loft(
        [
          [s.cabinRear - 0.12, w, base, top],
          [L - 0.75, w, base + 0.01, top - 0.015],
          [L - 0.17, w * 0.91, base + 0.14, top - 0.06],
          [L, w * 0.78, base + 0.2, top - 0.12],
        ],
        this.paint,
        this.body,
      );
    } else
      loft(
        [
          [-L, w * 0.82, base + 0.05, top - 0.13],
          [-L + 0.24, w * 0.98, base, top - 0.015],
          [-L + 1, w, base, top],
          [L - 0.75, w, base + 0.01, top - 0.015],
          [L - 0.17, w * 0.91, base + 0.14, top - 0.06],
          [L, w * 0.78, base + 0.2, top - 0.12],
        ],
        this.paint,
        this.body,
      );
    box(w * 1.9, 0.09, L * 1.7, 0, base + 0.02, 0, trim, 0.03);
    // Hood and boot seam accents are inset geometry, separate from the cabin.
    for (const side of [-1, 1]) {
      box(
        0.012,
        0.018,
        (L - s.cabinFront) * 0.8,
        side * w * 0.67,
        top + 0.008,
        s.cabinFront + (L - s.cabinFront) / 2,
        trim,
        0.001,
      );
      box(
        0.035,
        0.055,
        s.pickup ? 1.3 : 2.2,
        side * (w + 0.008),
        top - 0.09,
        s.pickup ? 0.7 : 0,
        trim,
        0.01,
      );
      box(
        0.12,
        0.035,
        0.27,
        side * (w + 0.02),
        top + 0.08,
        s.pickup ? 0.35 : -0.4,
        chrome,
        0.012,
      );
    }
    if (s.pickup) {
      // Open cargo bed: floor, separate rails and exposed inner volume.
      box(w * 1.8, 0.06, 1.8, 0, top - 0.24, -1.5, dark, 0.02);
      for (const side of [-1, 1])
        box(
          0.14,
          0.39,
          1.96,
          side * (w - 0.1),
          top + 0.12,
          -1.5,
          this.paint,
          0.04,
        );
      box(w * 1.85, 0.34, 0.14, 0, top + 0.1, -L + 0.1, this.paint, 0.03);
      for (let x = -0.65; x <= 0.65; x += 0.22)
        box(0.028, 0.025, 1.7, x, top - 0.2, -1.5, trim, 0.005);
    }
    const roofW = w * (s.offroad ? 0.85 : s.retro ? 0.74 : 0.73),
      lowW = w * 0.88,
      rear = s.cabinRear,
      front = s.cabinFront,
      rr = s.roofRear,
      rf = s.roofFront,
      roof = s.roof;
    // Window openings are bounded by pillars; the interior remains visible from the cockpit.
    box(
      roofW * 2,
      0.085,
      rf - rr + 0.2,
      0,
      roof,
      (rr + rf) / 2,
      this.paint,
      0.045,
    );
    panel(
      [
        [-lowW, top, front],
        [lowW, top, front],
        [roofW, roof - 0.04, rf],
        [-roofW, roof - 0.04, rf],
      ],
      glass,
      this.body,
    );
    panel(
      [
        [lowW, top, rear],
        [-lowW, top, rear],
        [-roofW, roof - 0.04, rr],
        [roofW, roof - 0.04, rr],
      ],
      glass,
      this.body,
    );
    for (const side of [-1, 1]) {
      panel(
        [
          [side * lowW, top, rear],
          [side * lowW, top, front],
          [side * roofW, roof - 0.05, rf],
          [side * roofW, roof - 0.05, rr],
        ],
        glass,
        this.body,
      );
      for (const [z, z2] of [
        [rear, rr],
        [front, rf],
      ]) {
        const from = new THREE.Vector3(side * lowW, top, z),
          to = new THREE.Vector3(side * roofW, roof, z2),
          d = to.clone().sub(from);
        const g = new THREE.CylinderGeometry(0.045, 0.05, d.length(), 8),
          m = new THREE.Mesh(g, this.paint);
        m.position.copy(from.add(to).multiplyScalar(0.5));
        m.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          d.normalize(),
        );
        this.body.add(m);
      }
      if (!s.pickup)
        box(
          0.065,
          roof - top - 0.04,
          0.075,
          (side * (lowW + roofW)) / 2,
          top + (roof - top) / 2,
          -0.15,
          trim,
          0.008,
        );
      box(
        0.1,
        0.07,
        front - rear,
        side * lowW,
        top + 0.015,
        (front + rear) / 2,
        this.paint,
        0.02,
      );
      const mirror = box(
        0.2,
        0.15,
        0.29,
        side * (w + 0.13),
        top + 0.3,
        front - 0.13,
        this.paint,
        0.06,
      );
      box(
        0.13,
        0.1,
        0.015,
        mirror.position.x,
        mirror.position.y,
        mirror.position.z - 0.15,
        chrome,
        0.02,
      );
    }
    // Front grille, intakes, bumpers, and lamp signatures.
    box(w * 1.75, 0.19, 0.13, 0, base + 0.18, L - 0.02, trim, 0.045);
    box(w * 0.85, 0.22, 0.045, 0, top - 0.16, L + 0.008, dark, 0.02);
    for (let x = -w * 0.36; x <= w * 0.36; x += 0.085)
      box(0.017, 0.16, 0.018, x, top - 0.16, L + 0.037, chrome, 0.001);
    box(w * 1.84, 0.12, 0.12, 0, base + 0.2, -L + 0.02, trim, 0.035);
    box(0.6, 0.04, 0.035, 0, top - 0.02, -L - 0.018, chrome, 0.01);
    if (s.retro) {
      for (const side of [-1, 1]) {
        const h = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.07, 24),
          head,
        );
        h.rotation.x = Math.PI / 2;
        h.position.set(side * w * 0.65, top - 0.15, L - 0.035);
        this.body.add(h);
        this.lamps.push(h);
        box(0.18, 0.27, 0.055, side * w * 0.78, top - 0.12, -L, tail, 0.03);
        this.brakes.push(tail);
      }
    } else {
      for (const side of [-1, 1]) {
        const h = box(
          w * 0.46,
          0.1,
          0.065,
          side * w * 0.66,
          top - 0.11,
          L - 0.01,
          head,
          0.025,
        );
        this.lamps.push(h);
        box(
          w * 0.53,
          0.12,
          0.055,
          side * w * 0.64,
          top - 0.1,
          -L - 0.025,
          tail,
          0.02,
        );
      }
      if (index === 1) {
        box(w * 1.55, 0.035, 0.13, 0, top + 0.23, -L + 0.27, trim, 0.018);
        for (const x of [-0.55, 0.55])
          box(0.045, 0.2, 0.06, x, top + 0.11, -L + 0.27, trim, 0.005);
      }
    }
    this.brakes.push(tail);
    this.headMaterial = head;
    // Four independent wheel mounts permit visible steering and terrain articulation.
    for (const side of [-1, 1])
      for (const frontWheel of [false, true]) {
        const pivot = new THREE.Group();
        pivot.position.set(
          side * (w - 0.035),
          s.radius,
          ((frontWheel ? 1 : -1) * s.wheelbase) / 2,
        );
        this.root.add(pivot);
        const spin = new THREE.Group();
        pivot.add(spin);
        this.wheels.push({ pivot, spin, front: frontWheel, side });
        if (frontWheel) this.steerPivots.push(pivot);
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(s.radius, s.radius, 0.245, 32, 1),
          rubber,
        );
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        spin.add(tire);
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(
            s.radius * 0.67,
            s.radius * 0.67,
            0.253,
            24,
          ),
          chrome,
        );
        rim.rotation.z = Math.PI / 2;
        spin.add(rim);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(
            s.radius * 0.48,
            s.radius * 0.48,
            0.26,
            20,
          ),
          trim,
        );
        disc.rotation.z = Math.PI / 2;
        spin.add(disc);
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * Math.PI * 2;
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.264, s.radius * 0.1, s.radius * 1.12),
            s.retro ? chrome : chrome,
          );
          spoke.rotation.x = a;
          spin.add(spoke);
        }
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.272, 16),
          chrome,
        );
        cap.rotation.z = Math.PI / 2;
        spin.add(cap);
        // Wheel-arch trim follows an actual curved arc above the tire.
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(s.radius + 0.055, 0.038, 5, 24, Math.PI),
          trim,
        );
        arch.rotation.y = Math.PI / 2;
        arch.position.copy(pivot.position);
        this.body.add(arch);
      }
    if (s.offroad) {
      for (const side of [-1, 1]) {
        box(
          0.16,
          0.1,
          s.length * 0.7,
          side * (w + 0.05),
          base + 0.06,
          0,
          trim,
          0.035,
        );
        box(
          0.09,
          0.11,
          rf - rr + 0.25,
          side * roofW * 0.85,
          roof + 0.1,
          (rf + rr) / 2,
          trim,
          0.025,
        );
      }
      if (!s.pickup) {
        const spare = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.22, 24),
          rubber,
        );
        spare.rotation.x = Math.PI / 2;
        spare.position.set(0.46, top + 0.16, -L - 0.12);
        this.body.add(spare);
      }
    }
    // Dashboard, seats, steering wheel and illuminated instruments for cockpit view.
    box(w * 1.65, 0.18, 0.36, 0, top - 0.03, front - 0.15, dark, 0.04);
    for (const x of [-w * 0.46, w * 0.46]) {
      box(0.53, 0.19, 0.63, x, base + 0.28, -0.1, dark, 0.08);
      const seat = box(0.51, 0.58, 0.15, x, base + 0.6, -0.44, dark, 0.065);
      seat.rotation.x = -0.1;
    }
    const steering = new THREE.Mesh(
      new THREE.TorusGeometry(0.215, 0.025, 8, 32),
      trim,
    );
    steering.position.set(w * 0.47, top + 0.05, front - 0.45);
    steering.rotation.x = 0.25;
    this.body.add(steering);
    this.steering = steering;
    for (let i = 0; i < 3; i++) {
      const spoke = box(
        0.018,
        0.2,
        0.025,
        w * 0.47,
        top + 0.04,
        front - 0.45,
        chrome,
        0.005,
      );
      spoke.rotation.z = (i * Math.PI * 2) / 3;
    }
    const gaugeMat = new THREE.MeshStandardMaterial({
      color: "#b6d5b0",
      emissive: "#b6d5b0",
      emissiveIntensity: 0.7,
    });
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), gaugeMat);
      g.rotation.y = Math.PI;
      g.position.set(w * 0.47 + (i - 0.5) * 0.18, top + 0.04, front - 0.344);
      this.body.add(g);
    }
    // An actual rear-facing plane, parented to the body, carries the full plate text.
    const texture = plateTexture();
    this.ownedTextures.push(texture);
    this.plateMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.45,
      emissive: "#fff5d4",
      emissiveMap: texture,
      emissiveIntensity: 0.12,
    });
    this.plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.99, 0.228),
      this.plateMaterial,
    );
    this.plate.name = PLATE_TEXT;
    this.plate.rotation.y = Math.PI;
    this.plate.position.set(0, base + 0.25, -L - 0.086);
    this.body.add(this.plate);
    box(1.06, 0.28, 0.035, 0, base + 0.25, -L - 0.063, trim, 0.025);
    const plateLight = new THREE.PointLight("#fff5cd", 0.3, 1.8, 2);
    plateLight.position.set(0, base + 0.48, -L - 0.17);
    this.body.add(plateLight);
    this.plateLight = plateLight;
    for (const side of [-1, 1]) {
      const light = new THREE.SpotLight("#fff0ce", 0, 100, 0.42, 0.55, 1.2);
      light.position.set(side * 0.64, top - 0.1, L - 0.06);
      light.target.position.set(side * 0.64, 0, L + 35);
      this.body.add(light, light.target);
      this.lamps.push(light);
    }
    // Static contact shadow is subtle and works even on the low preset.
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d"),
      grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,.48)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    this.ownedTextures.push(shadowTexture);
    const sm = new THREE.Mesh(
      new THREE.PlaneGeometry(s.width * 1.6, s.length * 1.25),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    sm.rotation.x = -Math.PI / 2;
    sm.position.y = 0.07;
    this.root.add(sm);
  }
  color(value) {
    this.paint.color.set(value);
  }
  lighting(on, night, brake) {
    this.headMaterial.emissiveIntensity = on ? 2.5 : 0.2;
    for (const l of this.lamps)
      if (l.isSpotLight) l.intensity = on ? (night ? 55 : 15) : 0;
    for (const m of this.brakes)
      m.emissiveIntensity = brake ? 3.8 : night ? 0.9 : 0.25;
    this.plateMaterial.emissiveIntensity = night ? 0.65 : 0.12;
    this.plateLight.intensity = night ? 0.7 : 0.1;
  }
  animate(state, dt, route) {
    for (const w of this.wheels) {
      w.spin.rotation.x += (state.speed * dt) / this.spec.radius;
      if (w.front) w.pivot.rotation.y = state.steer * 0.48;
      const s = Math.sin(state.yaw),
        c = Math.cos(state.yaw),
        x = state.x + w.pivot.position.x * c + w.pivot.position.z * s,
        z = state.z - w.pivot.position.x * s + w.pivot.position.z * c;
      const road = route.nearest(x, z),
        distance = Math.abs(road.offset),
        surface =
          distance < route.width / 2
            ? 0.065
            : distance < route.width / 2 + 0.95
              ? 0.018
              : 0;
      const ground = route.height(x, z) + surface;
      const bodyHeightAtWheel =
        state.y +
        Math.sin(state.pitch) * w.pivot.position.z +
        Math.sin(state.roll) * w.pivot.position.x;
      const relative = ground - bodyHeightAtWheel;
      w.pivot.position.y = THREE.MathUtils.damp(
        w.pivot.position.y,
        this.spec.radius + THREE.MathUtils.clamp(relative, -0.22, 0.22),
        12,
        dt,
      );
    }
    this.body.rotation.z = THREE.MathUtils.damp(
      this.body.rotation.z,
      -state.steer * Math.min(Math.abs(state.speed) * 0.004, 0.055),
      6,
      dt,
    );
    this.body.position.y = THREE.MathUtils.damp(
      this.body.position.y,
      -state.accel * 0.004 +
        Math.sin(state.distance * 1.6) *
          Math.min(
            state.offroad ? 0.035 : 0.006,
            Math.abs(state.speed) * 0.002,
          ),
      this.spec.suspension,
      dt,
    );
    this.steering.rotation.z = -state.steer * 0.8;
  }
  dispose() {
    const geos = new Set(),
      mats = new Set();
    this.root.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          mats.add(m);
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    this.ownedTextures.forEach((t) => t.dispose());
    this.root.removeFromParent();
  }
}
