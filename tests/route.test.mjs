import test from "node:test";
import assert from "node:assert/strict";
import { Route } from "../src/world/route.js";

test("same seed reproduces the world; different seeds change it", () => {
  const a = new Route("test34"),
    b = new Route("test34"),
    c = new Route("other");
  for (let z = -500; z < 10000; z += 77) {
    assert.deepEqual(a.sample(z), b.sample(z));
    assert.equal(a.height(400, z), b.height(400, z));
  }
  assert.notEqual(a.x(800), c.x(800));
});
test("road height and position stay continuous at all chunk and spline joins", () => {
  for (const type of ["asphalt", "mountain", "dirt"]) {
    const r = new Route("GENCEBAY34", type);
    for (let z = -500; z < 18000; z += 10) {
      const a = r.sample(z - 0.0001),
        b = r.sample(z + 0.0001);
      assert.ok(Math.abs(a.x - b.x) < 0.002);
      assert.ok(Math.abs(a.y - b.y) < 0.002);
      assert.ok(Math.abs(a.yaw - b.yaw) < 0.002);
    }
    for (let z = 0; z < 6000; z += 41) {
      const p = r.sample(z);
      assert.ok(Math.abs(r.height(p.x, p.z) - p.y) < 0.01);
      for (const offset of [-r.width / 2, r.width / 2])
        assert.ok(
          Math.abs(r.height(p.x + p.nx * offset, p.z + p.nz * offset) - p.y) <
            0.035,
        );
    }
  }
});
test("nearest road projection recovers lane offset and remains stable far from origin", () => {
  const r = new Route("GENCEBAY34");
  for (const z of [0, 120, 999, 2050, 1e6, 1e8]) {
    const p = r.sample(z),
      q = r.nearest(p.x + p.nx * 2, p.z + p.nz * 2);
    assert.ok(Math.abs(q.offset - 2) < 0.005);
    assert.ok(Math.abs(q.z - z) < 0.05);
  }
});
