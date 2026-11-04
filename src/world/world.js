import * as THREE from "three";
import { hashSeed, random, smoothstep, lerp } from "../core/math.js";
import { qualityPresets } from "../core/settings.js";

export const BIOMES = {
  alpine: {
    name: "Yeşil tepeler",
    scene: "Kuzeyin yeşil yolları",
    ground: ["#718260", "#9ba071", "#a8aa7c"],
    leaf: ["#35584a", "#476953", "#648367"],
    rock: "#a6a495",
    water: "#82a9a5",
  },
  autumn: {
    name: "Sonbahar",
    scene: "Altın yaprakların izinde",
    ground: ["#847951", "#ac975e", "#b6a073"],
    leaf: ["#a95830", "#c68537", "#838052"],
    rock: "#9c927f",
    water: "#8d9e9a",
  },
  snow: {
    name: "Karlı dağlar",
    scene: "Zirvelerin sessizliği",
    ground: ["#cbd8d5", "#edf0e7", "#c0d0ce"],
    leaf: ["#48625c", "#708a7e", "#b6c7bd"],
    rock: "#9caaa9",
    water: "#9bb9c0",
  },
  desert: {
    name: "Bozkır",
    scene: "Rüzgârın çizdiği yollar",
    ground: ["#b6a178", "#d0b38a", "#a99068"],
    leaf: ["#7c7c50", "#929061", "#b4a773"],
    rock: "#b79f83",
    water: "#8ca7a0",
  },
};
const LENGTH = 160;
const OFFSETS = [
  -1800, -1400, -1050, -800, -580, -420, -300, -210, -145, -100, -70, -48, -32,
  -22, -16, -12, -9, -6, 0, 6, 9, 12, 16, 22, 32, 48, 70, 100, 145, 210, 300,
  420, 580, 800, 1050, 1400, 1800,
];
const temp = new THREE.Object3D(),
  tempColor = new THREE.Color();

export class World {
  constructor(scene, route, settings) {
    this.scene = scene;
    this.route = route;
    this.settings = settings;
    this.chunks = new Map();
    this.extensions = new Map();
    this.origin = { x: 0, z: 0 };
    this.shared = {
      trunk: new THREE.CylinderGeometry(0.16, 0.27, 2.5, 5),
      pine: new THREE.ConeGeometry(1, 1, 7),
      crown: new THREE.IcosahedronGeometry(1, 1),
      rock: new THREE.IcosahedronGeometry(1, 0),
      grass: new THREE.ConeGeometry(0.3, 1.6, 3),
      post: new THREE.BoxGeometry(0.15, 1.2, 0.15),
    };
    this.materials = {
      trunk: new THREE.MeshStandardMaterial({ color: "#665b46", roughness: 1 }),
      leaf: new THREE.MeshStandardMaterial({ roughness: 1 }),
      rock: new THREE.MeshStandardMaterial({ roughness: 1 }),
      grass: new THREE.MeshStandardMaterial({ roughness: 1 }),
      post: new THREE.MeshStandardMaterial({
        color: "#e5e5d6",
        roughness: 0.8,
      }),
      terrain: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        flatShading: true,
      }),
      road: new THREE.MeshStandardMaterial({
        color: "#50534c",
        roughness: 0.96,
      }),
      shoulder: new THREE.MeshStandardMaterial({
        color: "#b3b099",
        roughness: 1,
      }),
      line: new THREE.MeshStandardMaterial({ color: "#e6dfbd", roughness: 1 }),
      rail: new THREE.MeshStandardMaterial({
        color: "#999f94",
        metalness: 0.4,
        roughness: 0.7,
      }),
    };
    this.configure();
  }
  configure() {
    this.palette = BIOMES[this.settings.biome];
    this.preset = qualityPresets[this.settings.quality];
    this.materials.rock.color.set(this.palette.rock);
    this.materials.road.color.set(
      this.settings.road === "dirt"
        ? "#9c8768"
        : this.settings.biome === "snow"
          ? "#7b8885"
          : "#51554e",
    );
    this.materials.shoulder.color.set(
      this.settings.biome === "snow"
        ? "#d8e2de"
        : this.settings.road === "dirt"
          ? "#b5a180"
          : "#a6a38e",
    );
  }
  setOrigin(x, z) {
    this.origin.x = x;
    this.origin.z = z;
    for (const chunk of [...this.chunks.values(), ...this.extensions.values()])
      chunk.position.set(chunk.userData.x - x, 0, chunk.userData.z - z);
  }
  update(z, immediate = false, x = this.route.x(z)) {
    const center = Math.floor(z / LENGTH),
      p = this.preset;
    for (const [id, chunk] of this.chunks)
      if (id < center - p.behind || id > center + p.ahead) {
        this.disposeChunk(chunk);
        this.chunks.delete(id);
      }
    const needed = [];
    for (let i = center - p.behind; i <= center + p.ahead; i++)
      if (!this.chunks.has(i)) needed.push(i);
    needed.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    for (const id of immediate ? needed : needed.slice(0, 1))
      this.chunks.set(id, this.createChunk(id));
    this.extendOffroad(x, z, immediate);
  }
  rebuild(z) {
    for (const c of [...this.chunks.values(), ...this.extensions.values()])
      this.disposeChunk(c);
    this.chunks.clear();
    this.extensions.clear();
    this.configure();
    this.update(z, true);
  }
  extendOffroad(x, z, immediate) {
    const far = Math.abs(x - this.route.x(z)) > 1200,
      cx = Math.floor(x / 640),
      cz = Math.floor(z / 640),
      needed = [];
    for (const [key, chunk] of this.extensions)
      if (
        !far ||
        Math.abs(chunk.userData.tx - cx) > 2 ||
        Math.abs(chunk.userData.tz - cz) > 2
      ) {
        this.disposeChunk(chunk);
        this.extensions.delete(key);
      }
    if (!far) return;
    for (let dz = -2; dz <= 2; dz++)
      for (let dx = -2; dx <= 2; dx++) {
        const key = cx + dx + "," + (cz + dz);
        if (!this.extensions.has(key))
          needed.push({ key, tx: cx + dx, tz: cz + dz, d: dx * dx + dz * dz });
      }
    needed.sort((a, b) => a.d - b.d);
    for (const tile of immediate ? needed : needed.slice(0, 2))
      this.extensions.set(tile.key, this.createExtension(tile.tx, tile.tz));
  }
  createExtension(tx, tz) {
    const group = new THREE.Group(),
      baseX = tx * 640,
      baseZ = tz * 640,
      n = 32,
      positions = [],
      colors = [],
      indices = [];
    group.userData = { x: baseX, z: baseZ, tx, tz, owned: [] };
    group.position.set(baseX - this.origin.x, 0, baseZ - this.origin.z);
    const a = new THREE.Color(this.palette.ground[0]),
      b = new THREE.Color(this.palette.ground[1]);
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const x = baseX + i * 20,
          z = baseZ + j * 20,
          y = this.route.height(x, z);
        positions.push(i * 20, y - 0.045, j * 20);
        tempColor
          .copy(a)
          .lerp(
            b,
            smoothstep(0.15, 0.8, this.route.noise.value(x * 0.015, z * 0.015)),
          );
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const x = baseX + i * 20 + 10,
          z = baseZ + j * 20 + 10;
        if (Math.abs(x - this.route.x(z)) < 1740) continue;
        const a = j * (n + 1) + i,
          b = a + n + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, this.materials.terrain);
    mesh.receiveShadow = true;
    group.add(mesh);
    group.userData.owned.push(geo);
    const rng = random(
        hashSeed(this.settings.seed) ^
          Math.imul(tx, 374761393) ^
          Math.imul(tz, 668265263),
      ),
      crowns = [],
      trunks = [],
      rocks = [];
    for (let i = 0; i < 65 * this.preset.vegetation; i++) {
      const x = baseX + rng() * 640,
        z = baseZ + rng() * 640;
      if (Math.abs(x - this.route.x(z)) < 1740) continue;
      const y = this.route.height(x, z),
        s = 3 + rng() * 6;
      crowns.push({
        x,
        y: y + s * 0.9,
        z,
        sx: s * 0.5,
        sy: s * 0.65,
        sz: s * 0.5,
        color: this.palette.leaf[i % 3],
      });
      trunks.push({
        x,
        y: y + s * 0.3,
        z,
        sx: s * 0.2,
        sy: s * 0.4,
        sz: s * 0.2,
      });
    }
    for (let i = 0; i < 25 * this.preset.vegetation; i++) {
      const x = baseX + rng() * 640,
        z = baseZ + rng() * 640;
      if (Math.abs(x - this.route.x(z)) < 1740) continue;
      const y = this.route.height(x, z),
        s = 1 + rng() * 4;
      rocks.push({
        x,
        y: y + s * 0.3,
        z,
        sx: s,
        sy: s * 0.8,
        sz: s,
        ry: rng() * 6,
      });
    }
    this.instances(group, "crown", this.materials.leaf, 0, crowns);
    this.instances(group, "trunk", this.materials.trunk, 0, trunks);
    this.instances(group, "rock", this.materials.rock, 0, rocks);
    this.scene.add(group);
    return group;
  }
  disposeChunk(chunk) {
    this.scene.remove(chunk);
    chunk.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
    for (const resource of chunk.userData.owned) resource.dispose();
  }
  strip(group, start, end, left, right, material, step = 5, lift = 0.06) {
    const positions = [],
      indices = [],
      n = Math.max(1, Math.ceil((end - start) / step));
    for (let i = 0; i <= n; i++) {
      const r = this.route.sample(lerp(start, end, i / n));
      for (const offset of [left, right])
        positions.push(
          r.x + r.nx * offset - group.userData.x,
          r.y + lift,
          r.z + r.nz * offset - group.userData.z,
        );
      if (i < n) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    group.add(mesh);
    group.userData.owned.push(geo);
    return mesh;
  }
  createChunk(id) {
    const start = id * LENGTH,
      end = start + LENGTH,
      group = new THREE.Group(),
      baseX = Math.round(this.route.x(start));
    group.userData = { x: baseX, z: start, owned: [] };
    group.position.set(baseX - this.origin.x, 0, start - this.origin.z);
    const positions = [],
      colors = [],
      indices = [],
      rows = 24,
      n = OFFSETS.length,
      palette = this.palette,
      noise = this.route.noise;
    const c0 = new THREE.Color(palette.ground[0]),
      c1 = new THREE.Color(palette.ground[1]),
      c2 = new THREE.Color(palette.ground[2]);
    for (let j = 0; j <= rows; j++) {
      const z = lerp(start, end, j / rows),
        cx = this.route.x(z);
      for (const offset of OFFSETS) {
        const x = cx + offset,
          y = this.route.height(x, z);
        positions.push(x - baseX, y, z - start);
        const n0 = noise.value(x * 0.015, z * 0.015),
          n1 = noise.value(x * 0.13, z * 0.13);
        tempColor
          .copy(c0)
          .lerp(c1, smoothstep(0.15, 0.8, n0))
          .lerp(c2, n1 * 0.25);
        if (y > 125 && this.settings.biome === "snow")
          tempColor.lerp(new THREE.Color("#eef1e9"), smoothstep(125, 230, y));
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i,
          b = a + n;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, this.materials.terrain);
    terrain.receiveShadow = true;
    group.add(terrain);
    group.userData.owned.push(geo);
    const half = this.route.width / 2;
    this.strip(
      group,
      start,
      end,
      -half - 0.95,
      half + 0.95,
      this.materials.shoulder,
      4,
      0.018,
    );
    this.strip(group, start, end, -half, half, this.materials.road, 4, 0.065);
    if (this.settings.road !== "dirt") {
      this.strip(
        group,
        start,
        end,
        -half + 0.23,
        -half + 0.36,
        this.materials.line,
        4,
        0.08,
      );
      this.strip(
        group,
        start,
        end,
        half - 0.36,
        half - 0.23,
        this.materials.line,
        4,
        0.08,
      );
      // Marking cadence is global, so chunk boundaries cannot interrupt it.
      for (let z = Math.ceil(start / 15) * 15; z < end; z += 15)
        this.strip(
          group,
          z,
          Math.min(z + 5, end),
          -0.07,
          0.07,
          this.materials.line,
          2,
          0.081,
        );
    }
    this.vegetation(group, id);
    if (((id % 4) + 4) % 4 === 1) this.sign(group, start + 95, id);
    this.roadside(group, start, end, half);
    // A low valley lake is water geometry, with terrain naturally clipping its banks.
    if (((id % 7) + 7) % 7 === 2) {
      const z = start + 80,
        r = this.route.sample(z),
        side = id % 2 ? 1 : -1;
      const lakeGeo = new THREE.CircleGeometry(1, 48),
        lakeMat = new THREE.MeshStandardMaterial({
          color: palette.water,
          roughness: 0.26,
          metalness: 0.15,
          transparent: true,
          opacity: 0.88,
        });
      const lake = new THREE.Mesh(lakeGeo, lakeMat);
      lake.rotation.x = -Math.PI / 2;
      lake.scale.set(160, 105, 1);
      lake.position.set(r.x + side * 210 - baseX, r.y - 3, z - start);
      group.add(lake);
      group.userData.owned.push(lakeGeo, lakeMat);
    }
    this.scene.add(group);
    return group;
  }
  instances(group, key, material, count, entries) {
    if (!entries.length) return;
    const mesh = new THREE.InstancedMesh(
      this.shared[key],
      material,
      entries.length,
    );
    mesh.castShadow = key !== "grass";
    mesh.receiveShadow = true;
    entries.forEach((v, i) => {
      temp.position.set(v.x - group.userData.x, v.y, v.z - group.userData.z);
      temp.rotation.set(v.rx || 0, v.ry || 0, v.rz || 0);
      temp.scale.set(v.sx, v.sy, v.sz);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
      if (v.color) mesh.setColorAt(i, tempColor.set(v.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  vegetation(group, id) {
    const rng = random(hashSeed(this.settings.seed) ^ Math.imul(id, 65497)),
      trees = [],
      trunks = [],
      rocks = [],
      grasses = [];
    const density =
      this.preset.vegetation * (this.settings.biome === "desert" ? 0.25 : 1);
    for (let i = 0; i < 240 * density; i++) {
      const z = group.userData.z + rng() * LENGTH,
        offset = (rng() < 0.5 ? -1 : 1) * (14 + Math.pow(rng(), 1.65) * 660),
        x = this.route.x(z) + offset;
      if (this.route.noise.value(x * 0.006, z * 0.006) < 0.23) continue;
      const y = this.route.height(x, z),
        size = 3 + rng() * 7;
      const color = this.palette.leaf[Math.floor(rng() * 3)];
      if (this.settings.biome === "desert" && rng() < 0.65) continue;
      trunks.push({
        x,
        y: y + size * 0.25,
        z,
        sx: size * 0.22,
        sy: size * 0.4,
        sz: size * 0.22,
      });
      if (this.settings.biome === "autumn" || rng() > 0.73) {
        trees.push({
          x,
          y: y + size * 0.83,
          z,
          sx: size * 0.43,
          sy: size * 0.53,
          sz: size * 0.41,
          color,
          ry: rng() * 6,
          key: "crown",
        });
      } else
        for (let k = 0; k < 3; k++)
          trees.push({
            x,
            y: y + size * (0.4 + k * 0.23),
            z,
            sx: size * (0.43 - k * 0.1),
            sy: size * 0.66,
            sz: size * (0.43 - k * 0.1),
            color,
            ry: rng() * 6,
            key: "pine",
          });
    }
    for (let i = 0; i < 45 * this.preset.vegetation; i++) {
      const z = group.userData.z + rng() * LENGTH,
        x = this.route.x(z) + (rng() < 0.5 ? -1 : 1) * (10 + rng() * 220),
        y = this.route.height(x, z),
        s = 0.4 + rng() * 3;
      rocks.push({
        x,
        y: y + s * 0.3,
        z,
        sx: s,
        sy: s * 0.7,
        sz: s * 0.8,
        ry: rng() * 6,
        color: this.palette.rock,
      });
    }
    for (let i = 0; i < 600 * this.preset.vegetation; i++) {
      const z = group.userData.z + rng() * LENGTH,
        x =
          this.route.x(z) +
          (rng() < 0.5 ? -1 : 1) * (this.route.width / 2 + 1 + rng() * 65),
        y = this.route.height(x, z),
        s = 0.25 + rng() * 0.65;
      grasses.push({
        x,
        y: y + s * 0.6,
        z,
        sx: s,
        sy: s,
        sz: s,
        ry: rng() * 6,
        color: this.palette.ground[Math.floor(rng() * 3)],
      });
    }
    this.instances(group, "trunk", this.materials.trunk, 0, trunks);
    this.instances(
      group,
      "pine",
      this.materials.leaf,
      0,
      trees.filter((v) => v.key === "pine"),
    );
    this.instances(
      group,
      "crown",
      this.materials.leaf,
      0,
      trees.filter((v) => v.key === "crown"),
    );
    this.instances(group, "rock", this.materials.rock, 0, rocks);
    this.instances(group, "grass", this.materials.grass, 0, grasses);
  }
  roadside(group, start, end, half) {
    const posts = [];
    for (let z = start; z < end; z += 20)
      for (const side of [-1, 1]) {
        const r = this.route.sample(z),
          x = r.x + r.nx * (half + 1.4) * side,
          zz = z + r.nz * (half + 1.4) * side;
        posts.push({ x, y: r.y + 0.6, z: zz, sx: 1, sy: 1, sz: 1, ry: r.yaw });
      }
    this.instances(group, "post", this.materials.post, 0, posts);
    if (
      this.settings.road === "mountain" ||
      Math.floor(start / LENGTH) % 3 === 1
    ) {
      const side = Math.floor(start / LENGTH) % 2 ? 1 : -1;
      this.strip(
        group,
        start,
        end,
        Math.min(side * (half + 1.55), side * (half + 1.7)),
        Math.max(side * (half + 1.55), side * (half + 1.7)),
        this.materials.rail,
        5,
        0.85,
      );
    }
  }
  sign(group, z, id) {
    const r = this.route.sample(z),
      offset = this.route.width / 2 + 3.2,
      x = r.x + r.nx * offset,
      zz = z + r.nz * offset;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#385e50";
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = "#e9edde";
    ctx.lineWidth = 5;
    ctx.strokeRect(9, 9, 494, 174);
    ctx.fillStyle = "#f1efdf";
    ctx.textAlign = "center";
    ctx.font = "500 29px Segoe UI, sans-serif";
    ctx.fillText(
      ["Yolun Açık Olsun", "Manzaraya Karşı Bir Mola", "34 GENCEBAY"][
        Math.abs(id) % 3
      ],
      256,
      88,
    );
    ctx.font = "17px Segoe UI";
    ctx.fillText("GENCEBAY ROADS   ↗", 256, 137);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.BoxGeometry(3.6, 1.35, 0.09),
      mesh = new THREE.Mesh(geo, [
        this.materials.post,
        this.materials.post,
        this.materials.post,
        this.materials.post,
        mat,
        mat,
      ]);
    mesh.position.set(x - group.userData.x, r.y + 3.1, zz - group.userData.z);
    mesh.rotation.y = r.yaw;
    group.add(mesh);
    const pg = new THREE.CylinderGeometry(0.06, 0.06, 3, 6),
      post = new THREE.Mesh(pg, this.materials.post);
    post.position.copy(mesh.position);
    post.position.y -= 1.8;
    group.add(post);
    group.userData.owned.push(texture, mat, geo, pg);
  }
  dispose() {
    for (const c of [...this.chunks.values(), ...this.extensions.values()])
      this.disposeChunk(c);
    this.chunks.clear();
    this.extensions.clear();
    Object.values(this.shared).forEach((g) => g.dispose());
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
