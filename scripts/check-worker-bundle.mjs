import { readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const chunksDirectory = new URL("../apps/web/.next/static/chunks/", import.meta.url);
const budgetBytes = 1_572_864;
const marker = "browser compile limit";

const files = await walk(chunksDirectory.pathname);
let worker;
for (const file of files.filter((candidate) => candidate.endsWith(".js"))) {
  const source = await readFile(file);
  if (source.includes(marker)) {
    worker = { file, source };
    break;
  }
}

if (!worker) {
  throw new Error("Could not locate the compiled browser worker chunk.");
}

const result = {
  schemaVersion: 1,
  file: relative(root.pathname, worker.file),
  rawBytes: worker.source.byteLength,
  gzipBytes: gzipSync(worker.source).byteLength,
  budgetBytes,
};
console.log(JSON.stringify(result, null, 2));
if (result.gzipBytes > budgetBytes) process.exitCode = 1;

async function walk(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}
