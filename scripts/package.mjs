import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await stat(path.join(dist, "index.html")).catch(() => {
  throw Error("Önce npm run build çalıştırın.");
});
await mkdir(path.join(dist, "licenses"), { recursive: true });
for (const file of ["THREE-LICENSE.txt", "VITE-LICENSE.txt"])
  await copyFile(
    path.join(root, "licenses", file),
    path.join(dist, "licenses", file),
  );
await copyFile(
  path.join(root, "LICENSE"),
  path.join(dist, "licenses", "PROJECT-LICENSE.txt"),
);
await copyFile(
  path.join(root, "THIRD_PARTY_NOTICES.md"),
  path.join(dist, "THIRD_PARTY_NOTICES.md"),
);

const allowed = [
  "src",
  "public",
  "dist",
  "docs",
  "tests",
  "scripts",
  "licenses",
  ".github",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "README.md",
  "SUNUM_REHBERI.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  ".gitignore",
  ".gitattributes",
  "BASLAT.cmd",
  "baslat.sh",
];
const files = [];
async function collect(relative) {
  const info = await stat(path.join(root, relative));
  if (info.isDirectory())
    for (const entry of (await readdir(path.join(root, relative))).sort())
      await collect(relative + "/" + entry);
  else files.push(relative.replaceAll("\\", "/"));
}
for (const file of allowed) await collect(file);
const buffers = await Promise.all(
  files.map((file) => readFile(path.join(root, file))),
);
const manifest = {
  project: "GENCEBAY ROADS",
  version: "1.0.0",
  builtAt: new Date().toISOString(),
  files: files.map((file, i) => ({
    path: file,
    bytes: buffers[i].length,
    sha256: createHash("sha256").update(buffers[i]).digest("hex"),
  })),
};
files.push("BUILD_MANIFEST.json");
buffers.push(Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));

// Small standard ZIP writer: UTF-8 names, DEFLATE, CRC32; no extra package required.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const local = [],
  central = [];
let offset = 0;
const now = new Date(),
  dosTime =
    (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1),
  dosDate =
    ((now.getFullYear() - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();
for (let i = 0; i < files.length; i++) {
  const name = Buffer.from("GENCEBAY-ROADS/" + files[i]),
    data = buffers[i],
    compressed = deflateRawSync(data),
    crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);
  head.writeUInt16LE(20, 4);
  head.writeUInt16LE(0x800, 6);
  head.writeUInt16LE(8, 8);
  head.writeUInt16LE(dosTime, 10);
  head.writeUInt16LE(dosDate, 12);
  head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(compressed.length, 18);
  head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(name.length, 26);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50, 0);
  entry.writeUInt16LE(20, 4);
  entry.writeUInt16LE(20, 6);
  entry.writeUInt16LE(0x800, 8);
  entry.writeUInt16LE(8, 10);
  entry.writeUInt16LE(dosTime, 12);
  entry.writeUInt16LE(dosDate, 14);
  entry.writeUInt32LE(crc, 16);
  entry.writeUInt32LE(compressed.length, 20);
  entry.writeUInt32LE(data.length, 24);
  entry.writeUInt16LE(name.length, 28);
  entry.writeUInt32LE(offset, 42);
  local.push(head, name, compressed);
  central.push(entry, name);
  offset += head.length + name.length + compressed.length;
}
const centralData = Buffer.concat(central),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralData.length, 12);
end.writeUInt32LE(offset, 16);
await mkdir(path.join(root, "release"), { recursive: true });
const destination = path.join(root, "release", "GENCEBAY-ROADS-teslim.zip");
const zip = Buffer.concat([...local, centralData, end]);
await writeFile(destination, zip);
await writeFile(
  path.join(root, "release", "BUILD_MANIFEST.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `${files.length} dosya · ${(zip.length / 1024).toFixed(0)} KB · ${destination}`,
);
