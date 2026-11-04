import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Route } from "../src/world/route.js";
import { World } from "../src/world/world.js";
import { defaults, qualityPresets, Settings } from "../src/core/settings.js";
import { canvasDocument } from "./helpers.mjs";

test("chunks unload and dispose buffers over a 20 km journey; floating origin is exact", () => {
  canvasDocument();
  const scene = new THREE.Scene(),
    world = new World(scene, new Route(), { ...defaults, quality: "low" });
  world.update(0, true);
  const expected = qualityPresets.low.ahead + qualityPresets.low.behind + 1;
  let disposed = 0;
  for (const c of world.chunks.values())
    c.userData.owned[0].addEventListener("dispose", () => disposed++);
  for (let z = 160; z <= 20000; z += 160) {
    world.update(z);
    assert.equal(world.chunks.size, expected);
    assert.equal(scene.children.length, expected);
  }
  assert.equal(disposed, expected);
  world.setOrigin(1024, 19456);
  for (const c of world.chunks.values()) {
    assert.equal(c.position.x + world.origin.x, c.userData.x);
    assert.equal(c.position.z + world.origin.z, c.userData.z);
  }
  world.dispose();
  assert.equal(scene.children.length, 0);
});
test("terrain shares identical edge vertices between adjacent chunks", () => {
  canvasDocument();
  const world = new World(new THREE.Scene(), new Route(), {
    ...defaults,
    quality: "low",
  });
  const a = world.createChunk(2),
    b = world.createChunk(3),
    pa = a.children[0].geometry.attributes.position,
    pb = b.children[0].geometry.attributes.position,
    n = 37;
  for (let i = 0; i < n; i++) {
    const j = pa.count - n + i;
    assert.ok(
      Math.abs(pa.getX(j) + a.userData.x - pb.getX(i) - b.userData.x) < 0.001,
    );
    assert.equal(pa.getY(j), pb.getY(i));
    assert.equal(pa.getZ(j) + a.userData.z, pb.getZ(i) + b.userData.z);
  }
  world.disposeChunk(a);
  world.disposeChunk(b);
  world.dispose();
});
test("offroad terrain follows the player beyond the road corridor and remains bounded", () => {
  canvasDocument();
  const world = new World(new THREE.Scene(), new Route(), {
    ...defaults,
    quality: "low",
  });
  world.update(0, true, 2500);
  assert.equal(world.extensions.size, 25);
  for (let x = 3000; x < 12000; x += 640) {
    world.update(0, true, x);
    assert.equal(world.extensions.size, 25);
    const tile = world.extensions.get(Math.floor(x / 640) + ",0");
    assert.ok(tile);
    assert.ok(tile.children[0].geometry.index.count > 0);
  }
  world.setOrigin(10000, 0);
  for (const c of world.extensions.values())
    assert.equal(c.position.x + 10000, c.userData.x);
  world.update(0, true, 0);
  assert.equal(world.extensions.size, 0);
  world.dispose();
});
test("settings and diary round-trip; unavailable or corrupt storage never blocks startup", () => {
  const values = new Map(),
    storage = {
      getItem: (k) => values.get(k),
      setItem: (k, v) => values.set(k, v),
    };
  const a = new Settings(storage);
  a.value.seed = "DAG34";
  a.diary.total = 3456;
  a.save();
  const b = new Settings(storage);
  assert.equal(b.value.seed, "DAG34");
  assert.equal(b.diary.total, 3456);
  values.set(
    "gencebay-settings",
    '{"quality":"broken","vehicle":99,"volume":1000,"color":"bad"}',
  );
  const repaired = new Settings(storage);
  assert.equal(repaired.value.quality, "high");
  assert.equal(repaired.value.vehicle, 4);
  assert.equal(repaired.value.volume, 1);
  assert.equal(repaired.value.color, defaults.color);
  values.set("gencebay-settings", "badjson");
  assert.doesNotThrow(() => new Settings(storage));
  assert.doesNotThrow(() =>
    new Settings({
      getItem() {
        throw Error("denied");
      },
    }).save(),
  );
});
