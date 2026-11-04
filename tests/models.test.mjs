import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { VehicleModel, PLATE_TEXT } from "../src/vehicles/factory.js";
import { canvasDocument } from "./helpers.mjs";

test("five distinct detailed vehicles carry an outward-facing, attached full plate", () => {
  const calls = canvasDocument(),
    signatures = new Set();
  for (let i = 0; i < 5; i++) {
    const m = new VehicleModel(i, "#a74934");
    m.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(m.root);
    assert.ok(bounds.max.y > 1.1);
    assert.ok(m.root.children.length >= 5);
    let meshes = 0;
    m.root.traverse((o) => {
      if (o.isMesh) {
        meshes++;
        const p = o.geometry.attributes.position;
        for (let j = 0; j < p.array.length; j++)
          assert.ok(Number.isFinite(p.array[j]));
      }
    });
    assert.ok(meshes > 70);
    signatures.add(
      [m.spec.length, m.spec.width, m.spec.roof, m.spec.cabinRear].join(","),
    );
    assert.equal(m.plate.name, PLATE_TEXT);
    assert.equal(m.plate.parent, m.body);
    assert.ok(m.plate.position.z < -m.spec.length / 2);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      m.plate.quaternion,
    );
    assert.ok(normal.z < -0.99);
    m.root.position.set(14, 3, 80);
    m.root.rotation.y = 1;
    m.root.updateMatrixWorld(true);
    const world = m.plate.getWorldPosition(new THREE.Vector3());
    assert.ok(world.distanceTo(m.root.position) < 4);
    m.lighting(true, true, true);
    assert.ok(m.plateMaterial.emissiveIntensity > 0.5);
    assert.ok(m.lamps.some((l) => l.isSpotLight && l.intensity > 0));
    m.dispose();
  }
  assert.equal(signatures.size, 5);
  assert.equal(calls.filter((c) => c.text === PLATE_TEXT).length, 5);
});
