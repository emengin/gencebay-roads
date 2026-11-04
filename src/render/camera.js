import * as THREE from "three";
import { clamp, damp } from "../core/math.js";
export const CAMERA_NAMES = ["Takip", "Yakın takip", "Kokpit", "Sinematik"];
const position = new THREE.Vector3(),
  target = new THREE.Vector3(),
  offset = new THREE.Vector3();
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = 0;
    this.distance = 9;
    this.orbit = 0.63;
    this.elevation = 0.27;
    this.userYaw = 0;
    this.userPitch = 0;
    this.photoDistance = 8;
    this.resetNext = true;
    this.elapsed = 0;
  }
  cycle() {
    this.mode = (this.mode + 1) % 4;
    this.userYaw = 0;
    this.userPitch = 0;
  }
  reset() {
    this.resetNext = true;
  }
  update(dt, vehicle, state, phase, input, settings, aspect) {
    this.elapsed += dt;
    const camera = this.camera,
      look = input.consumeLook();
    if (phase === "garage" || phase === "photo") {
      this.orbit -= look.x * settings.sensitivity;
      this.elevation = clamp(
        this.elevation + look.y * settings.sensitivity,
        -0.03,
        0.85,
      );
      if (phase === "garage") {
        if (!input.drag) this.orbit += dt * 0.035;
        this.distance = clamp(this.distance + look.zoom, 4.5, 15);
      } else this.photoDistance = clamp(this.photoDistance + look.zoom, 3, 45);
      const d =
        phase === "garage"
          ? aspect < 0.8
            ? 10
            : this.distance
          : this.photoDistance;
      offset.set(
        Math.sin(this.orbit) * d,
        2.1 + Math.sin(this.elevation) * d,
        -Math.cos(this.orbit) * d,
      );
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
      position.copy(vehicle.root.position).add(offset);
      target.copy(vehicle.root.position);
      target.y += 0.9;
      camera.fov = phase === "garage" ? 39 : 48;
      // Off-axis framing reserves the left side for the actual garage controls.
      if (phase === "garage" && aspect > 1.2)
        camera.setViewOffset(
          innerWidth,
          innerHeight,
          -innerWidth * 0.2,
          0,
          innerWidth,
          innerHeight,
        );
      else if (phase === "garage" && aspect < 0.8)
        camera.setViewOffset(
          innerWidth,
          innerHeight,
          0,
          innerHeight * 0.03,
          innerWidth,
          innerHeight,
        );
      else camera.clearViewOffset();
    } else {
      camera.clearViewOffset();
      this.userYaw = clamp(
        this.userYaw - look.x * settings.sensitivity,
        -1.7,
        1.7,
      );
      this.userPitch = clamp(
        this.userPitch + look.y * settings.sensitivity,
        -0.25,
        0.5,
      );
      if (!input.drag) {
        this.userYaw = damp(this.userYaw, 0, 1.5, dt);
        this.userPitch = damp(this.userPitch, 0, 1.5, dt);
      }
      this.distance = clamp(
        this.distance + look.zoom,
        vehicle.spec.length / 2 + 2.5,
        20,
      );
      const yaw = state.yaw + this.userYaw;
      if (this.mode === 2) {
        position.set(
          vehicle.spec.width * 0.23,
          Math.min(vehicle.spec.roof - 0.23, vehicle.belt + 0.55),
          vehicle.spec.cabinFront - 1.25,
        );
        position.applyMatrix4(vehicle.root.matrixWorld);
        target
          .set(
            Math.sin(yaw) * 25,
            Math.sin(state.pitch + this.userPitch - 0.045) * 25,
            Math.cos(yaw) * 25,
          )
          .add(position);
        camera.fov = 68;
      } else {
        const close = this.mode === 1,
          cinema = this.mode === 3,
          d = close
            ? vehicle.spec.length / 2 + 2.7
            : cinema
              ? 11
              : this.distance;
        const angle =
          yaw + (cinema ? Math.sin(this.elapsed * 0.12) * 0.75 + 1.1 : 0);
        offset.set(
          -Math.sin(angle) * d,
          (close ? 1.55 : cinema ? 3.8 : 1.2 + (d - 4.5) * 0.42) +
            this.userPitch * 8,
          -Math.cos(angle) * d,
        );
        position.copy(vehicle.root.position).add(offset);
        position.y += Math.max(0, state.pitch) * d * 0.65;
        const worldX = position.x + vehicle.root.userData.origin.x,
          worldZ = position.z + vehicle.root.userData.origin.z;
        position.y = Math.max(
          position.y,
          vehicle.root.userData.route.height(worldX, worldZ) + 0.6,
        );
        target.copy(vehicle.root.position);
        target.x += Math.sin(state.yaw) * (cinema ? 1 : 3.5);
        target.z += Math.cos(state.yaw) * (cinema ? 1 : 3.5);
        target.y += close ? 0.72 : 1.0;
        camera.fov = close
          ? 47
          : 52 + Math.min(Math.abs(state.speed) * 0.12, 5);
      }
    }
    if (this.resetNext || (this.mode === 2 && phase === "drive")) {
      camera.position.copy(position);
      this.resetNext = false;
    } else
      camera.position.lerp(
        position,
        1 - Math.exp(-(phase === "garage" ? 3 : 7) * dt),
      );
    // Smoothed target avoids jitter while pitch changes on rough terrain.
    if (!this.lookAt) this.lookAt = target.clone();
    this.lookAt.lerp(target, 1 - Math.exp(-10 * dt));
    if (this.mode === 2 && phase === "drive") this.lookAt.copy(target);
    camera.lookAt(this.lookAt);
    camera.updateProjectionMatrix();
  }
}
