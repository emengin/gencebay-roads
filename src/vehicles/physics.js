import { clamp, damp, angleDelta } from "../core/math.js";
export class VehiclePhysics {
  constructor(spec, route) {
    this.spec = spec;
    this.route = route;
    this.state = {
      x: 0,
      z: 0,
      y: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      speed: 0,
      steer: 0,
      accel: 0,
      distance: 0,
      offroad: false,
      braking: false,
    };
    this.lateral = 0;
    this.reverseHold = 0;
    this.reset(0);
  }
  reset(z = this.state.z) {
    const r = this.route.sample(z);
    Object.assign(this.state, {
      x: r.x + r.nx * 1.8,
      z: r.z + r.nz * 1.8,
      y: r.y + 0.07,
      yaw: r.yaw,
      pitch: Math.atan(r.slope),
      roll: 0,
      speed: 0,
      steer: 0,
      accel: 0,
      braking: false,
      offroad: false,
    });
    this.lateral = 0;
    this.reverseHold = 0;
  }
  autopilot(cruise) {
    const s = this.state,
      r = this.route.nearest(s.x, s.z),
      look = 10 + Math.abs(s.speed) * 0.8,
      target = this.route.sample(r.z + look);
    const tx = target.x + target.nx * 1.8,
      tz = target.z + target.nz * 1.8;
    const angle = angleDelta(Math.atan2(tx - s.x, tz - s.z), s.yaw),
      length = Math.hypot(tx - s.x, tz - s.z);
    const wheelAngle = Math.atan2(
      2 * this.spec.wheelbase * Math.sin(angle),
      Math.max(4, length),
    );
    const maxAngle = 0.48 / (1 + Math.abs(s.speed) * 0.025);
    const curvature = Math.abs(angleDelta(target.yaw, r.yaw)) / look;
    const desired = Math.min(
      cruise / 3.6,
      Math.sqrt(3.2 / Math.max(0.001, curvature)),
    );
    return {
      throttle: clamp((desired - s.speed) * 0.55, 0, 1),
      brake: clamp((s.speed - desired) * 0.4, 0, 1),
      steer: clamp(wheelAngle / maxAngle, -1, 1),
      handbrake: false,
      boost: false,
    };
  }
  step(dt, input, weather = "clear") {
    const s = this.state,
      p = this.spec,
      r = this.route.nearest(s.x, s.z),
      oldSpeed = s.speed;
    s.offroad = Math.abs(r.offset) > this.route.width / 2 + 0.7;
    const dirt = s.offroad || this.route.type === "dirt",
      grip =
        p.grip *
        (weather === "rain" ? 0.72 : weather === "snow" ? 0.5 : 1) *
        (dirt ? (p.offroad ? 0.86 : 0.57) : 1);
    s.steer = damp(s.steer, input.steer, 6 * Math.sqrt(1400 / p.mass), dt);
    // S first brakes. A short deliberate hold at rest engages reverse, without oscillating.
    if (input.brake > 0.1 && s.speed <= 0.35) this.reverseHold += dt;
    else this.reverseHold = 0;
    let acceleration = 0,
      heldAtRest = false;
    if (input.throttle > 0)
      acceleration +=
        s.speed < -0.25
          ? p.braking * input.throttle
          : p.acceleration *
            input.throttle *
            (1 -
              Math.max(0, s.speed) / (p.maxSpeed * (input.boost ? 1.15 : 1)));
    if (input.brake > 0) {
      if (s.speed > 0.35) acceleration -= p.braking * input.brake;
      else if (this.reverseHold > 0.25)
        acceleration -= p.acceleration * 0.55 * input.brake;
      else {
        s.speed = 0;
        acceleration = 0;
        heldAtRest = true;
      }
    }
    if (input.handbrake && Math.abs(s.speed) > 0.02)
      acceleration -= Math.sign(s.speed) * 18;
    if (!heldAtRest) {
      acceleration -=
        Math.sign(s.speed) * (0.22 + (dirt ? (p.offroad ? 0.7 : 1.5) : 0.2)) +
        s.speed * Math.abs(s.speed) * 0.0019;
      acceleration -= r.slope * 9.81;
    }
    if (
      input.throttle === 0 &&
      input.brake === 0 &&
      Math.abs(s.speed) < 0.13 &&
      Math.abs(r.slope) < 0.13
    ) {
      s.speed = 0;
      acceleration = 0;
    }
    s.speed = clamp(
      s.speed + acceleration * dt,
      -9,
      p.maxSpeed * (input.boost ? 1.15 : 1),
    );
    if (input.brake > 0 && oldSpeed > 0.35 && s.speed < 0) {
      s.speed = 0;
      this.reverseHold = 0;
    }
    if (input.handbrake && oldSpeed * s.speed < 0) s.speed = 0;
    const angle = (s.steer * 0.48) / (1 + Math.abs(s.speed) * 0.025);
    const yawRate = (s.speed / this.spec.wheelbase) * Math.tan(angle);
    const limited = clamp(
      yawRate,
      -grip / Math.max(3, Math.abs(s.speed)),
      grip / Math.max(3, Math.abs(s.speed)),
    );
    s.yaw += limited * dt;
    this.lateral = damp(
      this.lateral,
      input.handbrake ? -s.steer * s.speed * 0.22 : 0,
      input.handbrake ? 3 : grip,
      dt,
    );
    const dx =
        (Math.sin(s.yaw) * s.speed + Math.cos(s.yaw) * this.lateral) * dt,
      dz = (Math.cos(s.yaw) * s.speed - Math.sin(s.yaw) * this.lateral) * dt;
    s.x += dx;
    s.z += dz;
    s.distance += Math.hypot(dx, dz);
    s.accel = (s.speed - oldSpeed) / dt;
    s.braking = input.brake > 0.1 || input.handbrake;
    const ahead = this.route.height(
        s.x + (Math.sin(s.yaw) * p.wheelbase) / 2,
        s.z + (Math.cos(s.yaw) * p.wheelbase) / 2,
      ),
      behind = this.route.height(
        s.x - (Math.sin(s.yaw) * p.wheelbase) / 2,
        s.z - (Math.cos(s.yaw) * p.wheelbase) / 2,
      );
    const left = this.route.height(
        s.x - (Math.cos(s.yaw) * p.width) / 2,
        s.z + (Math.sin(s.yaw) * p.width) / 2,
      ),
      right = this.route.height(
        s.x + (Math.cos(s.yaw) * p.width) / 2,
        s.z - (Math.sin(s.yaw) * p.width) / 2,
      );
    s.y = damp(s.y, this.route.height(s.x, s.z) + 0.075, 14, dt);
    s.pitch = damp(
      s.pitch,
      clamp(Math.atan2(ahead - behind, p.wheelbase), -0.5, 0.5),
      8,
      dt,
    );
    s.roll = damp(
      s.roll,
      clamp(Math.atan2(right - left, p.width), -0.4, 0.4),
      8,
      dt,
    );
    return s;
  }
}
