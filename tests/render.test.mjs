import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { CameraController } from "../src/render/camera.js";
import { Atmosphere } from "../src/render/atmosphere.js";
import { VehicleModel } from "../src/vehicles/factory.js";
import { VehiclePhysics } from "../src/vehicles/physics.js";
import { Route } from "../src/world/route.js";
import { defaults } from "../src/core/settings.js";
import { canvasDocument } from "./helpers.mjs";

test("close camera frames every plate with legible geometric resolution; cockpit frames the steering wheel", () => {
  canvasDocument();
  globalThis.innerWidth = 1366;
  globalThis.innerHeight = 768;
  const route = new Route(),
    input = {
      consumeLook() {
        return { x: 0, y: 0, zoom: 0 };
      },
      drag: null,
    };
  for (let i = 0; i < 5; i++) {
    const model = new VehicleModel(i, defaults.color),
      physics = new VehiclePhysics(model.spec, route),
      s = physics.state;
    model.root.position.set(s.x, s.y, s.z);
    model.root.rotation.y = s.yaw;
    model.root.userData = { origin: { x: 0, z: 0 }, route };
    model.root.updateMatrixWorld(true);
    const camera = new THREE.PerspectiveCamera(48, 1366 / 768, 0.06, 6000),
      controller = new CameraController(camera);
    controller.mode = 1;
    for (let f = 0; f < 120; f++)
      controller.update(
        1 / 60,
        model,
        s,
        "drive",
        input,
        defaults,
        camera.aspect,
      );
    camera.updateMatrixWorld(true);
    const corners = [
      new THREE.Vector3(-0.495, -0.114, 0),
      new THREE.Vector3(0.495, 0.114, 0),
    ].map((p) => p.applyMatrix4(model.plate.matrixWorld).project(camera));
    for (const p of corners) {
      assert.ok(
        Math.abs(p.x) < 1 && Math.abs(p.y) < 1,
        model.spec.name + " plate in frame",
      );
      assert.ok(p.z > -1 && p.z < 1);
    }
    const width = (Math.abs(corners[1].x - corners[0].x) * 1366) / 2;
    assert.ok(width > 200, model.spec.name + " plate projected width " + width);
    controller.mode = 2;
    for (let f = 0; f < 120; f++)
      controller.update(
        1 / 60,
        model,
        s,
        "drive",
        input,
        defaults,
        camera.aspect,
      );
    camera.updateMatrixWorld(true);
    const wheel = model.steering
      .getWorldPosition(new THREE.Vector3())
      .project(camera);
    assert.ok(
      Math.abs(wheel.x) < 1 && Math.abs(wheel.y) < 1,
      model.spec.name + " steering wheel in cockpit frustum",
    );
    for (const phase of ["garage", "photo"])
      for (const mode of [0, 1, 2, 3]) {
        controller.mode = mode;
        controller.update(
          1 / 60,
          model,
          s,
          phase,
          input,
          defaults,
          camera.aspect,
        );
        for (const value of camera.projectionMatrix.elements)
          assert.ok(Number.isFinite(value));
      }
    model.dispose();
  }
});
test("weather/time/quality configurations produce finite scene data and valid Three shader includes", () => {
  globalThis.innerWidth = 1366;
  globalThis.innerHeight = 768;
  globalThis.devicePixelRatio = 1.5;
  const settings = { ...defaults },
    renderer = { shadowMap: {}, setPixelRatio() {}, setSize() {} },
    scene = new THREE.Scene(),
    atmosphere = new Atmosphere(scene, renderer, settings);
  for (const quality of ["low", "medium", "high", "ultra"])
    for (const time of ["morning", "noon", "sunset", "night"])
      for (const weather of ["clear", "cloudy", "fog", "rain", "snow"]) {
        Object.assign(settings, { quality, time, weather });
        atmosphere.configure();
        atmosphere.update(
          0.1,
          new THREE.Vector3(0, 20, 0),
          new THREE.PerspectiveCamera(),
        );
        assert.ok(scene.fog.far > scene.fog.near);
        assert.equal(renderer.shadowMap.enabled, quality !== "low");
        if (atmosphere.particle)
          for (const v of atmosphere.particle.geometry.attributes.position
            .array)
            assert.ok(Number.isFinite(v));
      }
  let shader = atmosphere.skyMaterial.fragmentShader;
  const include = /^[ \t]*#include +<([\w\d./]+)>/gm;
  shader = shader.replace(include, (_, name) => {
    assert.ok(THREE.ShaderChunk[name], "known shader chunk " + name);
    return THREE.ShaderChunk[name];
  });
  assert.ok(!shader.includes("#include"));
  assert.ok(atmosphere.stars.material.opacity > 0);
  assert.ok(atmosphere.sun.intensity < 1);
});
