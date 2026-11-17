import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  VehiclePresentation,
  PHYSICS_STEP,
} from "../src/render/vehicle-presentation.js";
import { CameraController } from "../src/render/camera.js";
import { VehicleModel } from "../src/vehicles/factory.js";
import { defaults } from "../src/core/settings.js";
import { canvasDocument } from "./helpers.mjs";

const stateAt = (speed = 25) => ({
  x: 1.8,
  y: 0.075,
  z: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  speed,
  steer: 0,
  accel: 0,
  distance: 0,
  offroad: false,
  braking: false,
});
const flat = {
  width: 9.6,
  type: "asphalt",
  height: () => 0,
  nearest: () => ({ offset: 1.8 }),
};
const input = { drag: null, consumeLook: () => ({ x: 0, y: 0, zoom: 0 }) };
const close = (a, b, epsilon = 1e-8) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);

test("90 Hz physics renders continuous motion at 30/60/75/90/120/144/165/240 Hz", () => {
  for (const fps of [30, 60, 75, 90, 120, 144, 165, 240])
    for (const speed of [3, 25, 60, -5]) {
      const state = stateAt(speed),
        motion = new VehiclePresentation(state);
      let accumulator = 0,
        last = 0;
      for (let frame = 0; frame < fps * 3; frame++) {
        accumulator += 1 / fps;
        while (accumulator + 1e-10 >= PHYSICS_STEP) {
          motion.capture(state);
          state.z += speed * PHYSICS_STEP;
          accumulator -= PHYSICS_STEP;
        }
        const rendered = motion.sample(state, accumulator / PHYSICS_STEP);
        if (frame > 3) close(rendered.z - last, speed / fps);
        last = rendered.z;
      }
    }
});

test("variable frame times interpolate without changing physics or crossing a full heading turn", () => {
  const state = stateAt(),
    motion = new VehiclePresentation(state);
  let accumulator = 0,
    time = 0;
  const frameTimes = [1 / 60, 1 / 144, 1 / 72, 1 / 50, 1 / 120];
  for (let frame = 0; frame < 600; frame++) {
    const dt = frameTimes[frame % frameTimes.length];
    time += dt;
    accumulator += dt;
    while (accumulator + 1e-10 >= PHYSICS_STEP) {
      motion.capture(state);
      state.z += 25 * PHYSICS_STEP;
      accumulator -= PHYSICS_STEP;
    }
    const saved = { ...state };
    close(
      motion.sample(state, accumulator / PHYSICS_STEP).z,
      25 * (time - PHYSICS_STEP),
    );
    assert.deepEqual(state, saved);
  }
  state.yaw = Math.PI - 0.02;
  motion.reset(state);
  motion.capture(state);
  state.yaw = -Math.PI + 0.02;
  close(motion.sample(state, 0.5).yaw, Math.PI);
});

test("reset discards interpolation history after vehicle/route/recovery teleports", () => {
  const state = stateAt(),
    motion = new VehiclePresentation(state);
  motion.capture(state);
  state.z = 100;
  motion.sample(state, 0.4);
  Object.assign(state, { x: -600, z: 9000, y: 80, yaw: 1.2, speed: 0 });
  motion.reset(state);
  for (const alpha of [0, 0.2, 0.8, 1])
    assert.deepEqual(motion.sample(state, alpha), state);
});

test("all five vehicles stay still on smooth asphalt at constant speed but retain load transfer", () => {
  canvasDocument();
  for (let i = 0; i < 5; i++) {
    const model = new VehicleModel(i, defaults.color),
      state = stateAt();
    for (let frame = 0; frame < 240; frame++) {
      state.z += state.speed / 120;
      state.distance += state.speed / 120;
      model.animate(state, 1 / 120, flat);
      close(model.body.position.y, 0);
      close(model.body.rotation.z, 0);
    }
    const wheel = model.wheels[0].spin.rotation.x;
    state.accel = 6;
    state.steer = 0.25;
    for (let f = 0; f < 60; f++) model.animate(state, 1 / 60, flat);
    assert.ok(
      model.body.position.y < -0.02,
      "acceleration still transfers load",
    );
    assert.ok(model.body.rotation.z < 0, "cornering still leans the body");
    assert.notEqual(model.wheels[0].spin.rotation.x, wheel);
    model.dispose();
  }
});

test("follow, close and cockpit cameras keep a constant-speed car stable on screen", () => {
  canvasDocument();
  globalThis.innerWidth = 1366;
  globalThis.innerHeight = 768;
  for (const fps of [30, 60, 90, 144])
    for (const mode of [0, 1, 2]) {
      const model = new VehicleModel(0, defaults.color),
        state = stateAt();
      model.root.userData = { origin: { x: 0, z: 0 }, route: flat };
      const motion = new VehiclePresentation(state);
      const camera = new THREE.PerspectiveCamera(48, 1366 / 768, 0.06, 6000);
      const controller = new CameraController(camera);
      controller.mode = mode;
      let accumulator = 0,
        initial = null;
      for (let f = 0; f < fps * 3; f++) {
        const dt = 1 / fps;
        accumulator += dt;
        while (accumulator + 1e-10 >= PHYSICS_STEP) {
          motion.capture(state);
          state.z += 25 * PHYSICS_STEP;
          state.distance += 25 * PHYSICS_STEP;
          accumulator -= PHYSICS_STEP;
        }
        const rendered = motion.sample(state, accumulator / PHYSICS_STEP);
        model.animate(rendered, dt, flat);
        model.root.position.set(rendered.x, rendered.y, rendered.z);
        model.root.updateMatrixWorld(true);
        controller.update(
          dt,
          model,
          rendered,
          "drive",
          input,
          defaults,
          camera.aspect,
        );
        camera.updateMatrixWorld(true);
        const point = (mode === 2 ? model.steering : model.body)
          .getWorldPosition(new THREE.Vector3())
          .project(camera);
        if (!initial) initial = point.clone();
        close(point.x, initial.x);
        close(point.y, initial.y);
      }
      model.dispose();
    }
});

test("floating-origin rebase and a camera reset do not introduce a framing jump", () => {
  canvasDocument();
  globalThis.innerWidth = 1366;
  globalThis.innerHeight = 768;
  const model = new VehicleModel(0, defaults.color),
    state = stateAt();
  model.root.userData = { origin: { x: 0, z: 0 }, route: flat };
  model.root.position.set(1.8, 0.075, 2050);
  model.root.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(48, 1366 / 768, 0.06, 6000);
  const controller = new CameraController(camera);
  controller.update(
    1 / 60,
    model,
    state,
    "drive",
    input,
    defaults,
    camera.aspect,
  );
  camera.updateMatrixWorld(true);
  const original = model.body
    .getWorldPosition(new THREE.Vector3())
    .project(camera);
  model.root.position.z -= 2048;
  model.root.userData.origin.z = 2048;
  controller.rebase(0, 2048);
  model.root.updateMatrixWorld(true);
  controller.update(
    1 / 60,
    model,
    state,
    "drive",
    input,
    defaults,
    camera.aspect,
  );
  camera.updateMatrixWorld(true);
  let actual = model.body.getWorldPosition(new THREE.Vector3()).project(camera);
  close(actual.x, original.x);
  close(actual.y, original.y);
  model.root.position.x += 500;
  model.root.position.z += 500;
  controller.reset();
  model.root.updateMatrixWorld(true);
  controller.update(
    1 / 60,
    model,
    state,
    "drive",
    input,
    defaults,
    camera.aspect,
  );
  camera.updateMatrixWorld(true);
  actual = model.body.getWorldPosition(new THREE.Vector3()).project(camera);
  close(actual.x, original.x);
  close(actual.y, original.y);
  model.dispose();
});
