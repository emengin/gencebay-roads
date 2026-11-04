export const defaults = {
  vehicle: 0,
  color: "#d6d2bf",
  biome: "alpine",
  seed: "GENCEBAY34",
  time: "morning",
  weather: "clear",
  road: "asphalt",
  quality: "high",
  volume: 0.32,
  muted: false,
  sensitivity: 0.65,
  cruise: 72,
  showFps: false,
};
export const qualityPresets = {
  low: {
    pixelRatio: 0.8,
    ahead: 5,
    behind: 5,
    vegetation: 0.35,
    shadow: 0,
    fog: 800,
    particles: 400,
  },
  medium: {
    pixelRatio: 1,
    ahead: 7,
    behind: 7,
    vegetation: 0.65,
    shadow: 1024,
    fog: 1100,
    particles: 800,
  },
  high: {
    pixelRatio: 1.5,
    ahead: 9,
    behind: 9,
    vegetation: 1,
    shadow: 2048,
    fog: 1500,
    particles: 1400,
  },
  ultra: {
    pixelRatio: 2,
    ahead: 12,
    behind: 12,
    vegetation: 1.4,
    shadow: 2048,
    fog: 1900,
    particles: 2200,
  },
};
export class Settings {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.value = { ...defaults };
    this.diary = {
      total: 0,
      longest: 0,
      trips: 0,
      lastVehicle: "Classic Sedan",
      biome: "alpine",
      seed: defaults.seed,
    };
    try {
      const saved = JSON.parse(storage.getItem("gencebay-settings") || "{}");
      for (const key of Object.keys(defaults))
        if (typeof saved[key] === typeof defaults[key])
          this.value[key] = saved[key];
      for (const [key, choices] of Object.entries({
        biome: ["alpine", "autumn", "snow", "desert"],
        time: ["morning", "noon", "sunset", "night"],
        weather: ["clear", "cloudy", "fog", "rain", "snow"],
        road: ["asphalt", "mountain", "dirt"],
        quality: Object.keys(qualityPresets),
      }))
        if (!choices.includes(this.value[key])) this.value[key] = defaults[key];
      this.value.vehicle = Math.max(
        0,
        Math.min(4, Math.trunc(this.value.vehicle)),
      );
      this.value.seed = this.value.seed.trim().slice(0, 40) || defaults.seed;
      if (!/^#[a-f\d]{6}$/i.test(this.value.color))
        this.value.color = defaults.color;
      for (const [k, a, b] of [
        ["volume", 0, 1],
        ["sensitivity", 0.2, 1.5],
        ["cruise", 30, 120],
      ])
        this.value[k] = Number.isFinite(this.value[k])
          ? Math.min(b, Math.max(a, this.value[k]))
          : defaults[k];
      const diary = JSON.parse(storage.getItem("gencebay-diary") || "{}");
      for (const key of Object.keys(this.diary))
        if (typeof diary[key] === typeof this.diary[key])
          this.diary[key] = diary[key];
      for (const key of ["total", "longest", "trips"])
        if (!Number.isFinite(this.diary[key]) || this.diary[key] < 0)
          this.diary[key] = 0;
    } catch {
      /* Private browsing can deny access; the drive still works. */
    }
  }
  save() {
    try {
      this.storage.setItem("gencebay-settings", JSON.stringify(this.value));
      this.storage.setItem("gencebay-diary", JSON.stringify(this.diary));
    } catch {
      /* Storage is optional. */
    }
  }
}
