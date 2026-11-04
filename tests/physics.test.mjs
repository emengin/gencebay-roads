import test from "node:test";
import assert from "node:assert/strict";
import { Route } from "../src/world/route.js";
import { VEHICLES } from "../src/vehicles/catalog.js";
import { VehiclePhysics } from "../src/vehicles/physics.js";
const neutral = {
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  boost: false,
};
function run(car, seconds, input, step = 1 / 90) {
  for (let i = 0; i < seconds / step; i++)
    car.step(step, typeof input === "function" ? input() : input);
}

test("accelerate, coast, brake, reverse, handbrake, and reset change real world state", () => {
  const car = new VehiclePhysics(VEHICLES[0], new Route());
  run(car, 4, { ...neutral, throttle: 1 });
  assert.ok(car.state.speed > 12);
  assert.ok(car.state.z > 20);
  const old = car.state.speed;
  run(car, 2, neutral);
  assert.ok(car.state.speed < old);
  run(car, 6, { ...neutral, brake: 1 });
  assert.ok(car.state.speed < -0.2);
  car.reset(700);
  assert.equal(car.state.speed, 0);
  assert.ok(
    Math.abs(car.route.nearest(car.state.x, car.state.z).offset - 1.8) < 0.01,
  );
  run(car, 3, { ...neutral, throttle: 1 });
  run(car, 3, { ...neutral, handbrake: true });
  assert.ok(Math.abs(car.state.speed) < 0.5);
});
test("steering reaches off-road terrain and state stays finite", () => {
  const car = new VehiclePhysics(VEHICLES[2], new Route());
  run(car, 8, { ...neutral, throttle: 1, steer: 0.6 });
  assert.ok(car.state.offroad);
  for (const [k, v] of Object.entries(car.state))
    if (typeof v === "number") assert.ok(Number.isFinite(v), k);
});
test("fixed timestep accumulator behavior is independent of display refresh rate", () => {
  const simulate = (hz) => {
    const car = new VehiclePhysics(VEHICLES[0], new Route());
    let accumulator = 0;
    for (let f = 0; f < hz * 8; f++) {
      accumulator += 1 / hz;
      while (accumulator + 1e-10 >= 1 / 90) {
        car.step(1 / 90, { ...neutral, throttle: 1, steer: 0.05 });
        accumulator -= 1 / 90;
      }
    }
    return car.state;
  };
  const a = simulate(30),
    b = simulate(144);
  assert.ok(Math.abs(a.z - b.z) < 1e-7);
  assert.ok(Math.abs(a.speed - b.speed) < 1e-7);
});
test("autodrive follows actual bends for five minutes on each road and each vehicle", () => {
  for (const type of ["asphalt", "mountain", "dirt"])
    for (const spec of VEHICLES) {
      const route = new Route("GENCEBAY34", type),
        car = new VehiclePhysics(spec, route);
      let max = 0;
      for (let i = 0; i < 300 * 60; i++) {
        car.step(1 / 60, car.autopilot(72));
        const offset = Math.abs(route.nearest(car.state.x, car.state.z).offset);
        max = Math.max(max, offset);
        assert.ok(
          offset < route.width / 2 + 0.5,
          `${type} ${spec.name} at ${i / 60}s off road: ${offset}`,
        );
      }
      assert.ok(
        car.state.distance > 4500,
        `${spec.name} made forward progress`,
      );
    }
});
test("wet and snowy autodrive keeps its lane", () => {
  for (const weather of ["rain", "snow"]) {
    const route = new Route("rainseed", "mountain"),
      car = new VehiclePhysics(VEHICLES[1], route);
    for (let i = 0; i < 180 * 60; i++) {
      car.step(1 / 60, car.autopilot(90), weather);
      assert.ok(
        Math.abs(route.nearest(car.state.x, car.state.z).offset) <
          route.width / 2 + 0.5,
        weather,
      );
    }
  }
});
