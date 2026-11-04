export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export const angleDelta = (a, b) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function hashSeed(text) {
  let h = 2166136261;
  for (const c of String(text)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class Noise {
  constructor(seed) {
    this.seed = seed;
  }
  hash(x, y) {
    let h =
      Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ this.seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  value(x, y) {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    const tx = smoothstep(0, 1, x - ix),
      ty = smoothstep(0, 1, y - iy);
    return lerp(
      lerp(this.hash(ix, iy), this.hash(ix + 1, iy), tx),
      lerp(this.hash(ix, iy + 1), this.hash(ix + 1, iy + 1), tx),
      ty,
    );
  }
  fbm(x, y, octaves = 4) {
    let v = 0,
      amplitude = 0.57,
      total = 0;
    for (let i = 0; i < octaves; i++) {
      v += (this.value(x, y) * 2 - 1) * amplitude;
      total += amplitude;
      x *= 2.03;
      y *= 2.03;
      amplitude *= 0.49;
    }
    return v / total;
  }
}

// Catmull–Rom interpolation keeps adjoining road sections C1 continuous.
export function catmull(p0, p1, p2, p3, t) {
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  );
}
