import { Noise, hashSeed, catmull, smoothstep, lerp } from "../core/math.js";

export class Route {
  constructor(seed = "GENCEBAY34", type = "asphalt") {
    this.seed = seed;
    this.noise = new Noise(hashSeed(seed));
    this.type = type;
  }
  get width() {
    return this.type === "mountain" ? 6.8 : this.type === "dirt" ? 8.4 : 9.6;
  }
  control(i) {
    return (
      (this.noise.value(i * 0.42, 12.4) - 0.5) *
      (this.type === "mountain" ? 660 : 440)
    );
  }
  x(z) {
    const p = z / 210,
      i = Math.floor(p),
      t = p - i;
    const curve = catmull(
      this.control(i - 1),
      this.control(i),
      this.control(i + 1),
      this.control(i + 2),
      t,
    );
    return curve * smoothstep(30, 220, Math.abs(z));
  }
  elevation(z) {
    return (
      26 +
      Math.sin(z * 0.0028) * 13 +
      this.noise.fbm(z * 0.0018, 83, 3) * (this.type === "mountain" ? 34 : 20)
    );
  }
  sample(z) {
    const x = this.x(z),
      y = this.elevation(z);
    const dx = this.x(z + 0.5) - this.x(z - 0.5);
    const dy = this.elevation(z + 0.5) - this.elevation(z - 0.5);
    const length = Math.hypot(dx, 1);
    return {
      x,
      y,
      z,
      dx,
      dy,
      yaw: Math.atan2(dx, 1),
      nx: 1 / length,
      nz: -dx / length,
      slope: dy / length,
    };
  }
  nearest(x, z) {
    let t = z;
    for (let i = 0; i < 3; i++) {
      const r = this.sample(t);
      t += ((x - r.x) * r.dx + (z - t)) / (1 + r.dx * r.dx);
    }
    const r = this.sample(t);
    r.offset = (x - r.x) * r.nx + (z - t) * r.nz;
    return r;
  }
  height(x, z) {
    const r = this.nearest(x, z),
      distance = Math.abs(r.offset);
    const n = this.noise;
    const ridge =
      Math.pow(Math.abs(n.fbm(x * 0.0013 + 33, z * 0.0015, 4)), 1.15) * 520;
    const rolling = n.fbm(x * 0.008, z * 0.008, 3) * 13;
    // Road is carved into the height field. The exact same function drives the car.
    const shoulder = smoothstep(this.width / 2 + 0.5, 70, distance);
    const mountains = smoothstep(25, 480, distance);
    const valley = Math.sin(z * 0.003 + 0.4) * 8;
    const terrain = r.y + (ridge * mountains + rolling + valley - 8) * shoulder;
    let height = lerp(
      r.y,
      terrain,
      smoothstep(this.width / 2 + 0.4, 18, distance),
    );
    const lakeIndex = Math.round((z - 400) / 1120),
      lakeZ = lakeIndex * 1120 + 400;
    if (Math.abs(z - lakeZ) < 145 && distance > 35) {
      const id = lakeIndex * 7 + 2,
        side = id % 2 ? 1 : -1;
      const centerX = this.x(lakeZ) + side * 210;
      const basin = Math.hypot((x - centerX) / 170, (z - lakeZ) / 115);
      height = lerp(
        height,
        this.elevation(lakeZ) - 7,
        1 - smoothstep(0.65, 1.2, basin),
      );
    }
    return height;
  }
}
