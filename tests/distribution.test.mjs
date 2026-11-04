import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

test("HTML has unique IDs and every JavaScript UI ID exists", async () => {
  const html = await readFile("index.html", "utf8"),
    ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const file of [
    "src/ui/ui.js",
    "src/game.js",
    "src/main.js",
    "src/core/input.js",
  ]) {
    const code = await readFile(file, "utf8");
    for (const m of code.matchAll(/(?:\$|querySelector)\(['"]#([\w-]+)['"]\)/g))
      assert.ok(ids.includes(m[1]), `${file} references missing #${m[1]}`);
  }
  for (const tag of [
    ...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g),
  ])
    assert.ok(!/^https?:|^\/\//i.test(tag[1]));
});
test("production HTML points to existing relative local assets", async () => {
  const html = await readFile("dist/index.html", "utf8");
  assert.ok(html.includes("GENCEBAY ROADS"));
  assert.ok(!html.includes("/src/main.js"));
  const files = [
    ...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g),
  ].map((m) => m[1]);
  assert.ok(files.some((f) => f.endsWith(".js")));
  assert.ok(files.some((f) => f.endsWith(".css")));
  for (const file of files) {
    assert.ok(file.startsWith("./"), file + " is relative");
    await access(path.join("dist", file));
  }
});
