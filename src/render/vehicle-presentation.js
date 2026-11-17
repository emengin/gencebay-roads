import { angleDelta, clamp, lerp } from "../core/math.js";

export const PHYSICS_STEP = 1 / 90;
const interpolated = [
  "x",
  "y",
  "z",
  "pitch",
  "roll",
  "speed",
  "steer",
  "accel",
  "distance",
];

// Only rendering interpolates. The authoritative physics state is never modified.
export class VehiclePresentation {
  constructor(state) {
    this.previous = {};
    this.state = {};
    this.reset(state);
  }
  reset(state) {
    Object.assign(this.previous, state);
    Object.assign(this.state, state);
  }
  capture(state) {
    Object.assign(this.previous, state);
  }
  sample(current, alpha) {
    const t = clamp(alpha, 0, 1);
    Object.assign(this.state, current);
    for (const key of interpolated)
      this.state[key] = lerp(this.previous[key], current[key], t);
    this.state.yaw =
      this.previous.yaw + angleDelta(current.yaw, this.previous.yaw) * t;
    return this.state;
  }
}
