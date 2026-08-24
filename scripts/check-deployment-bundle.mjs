import { access, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = new URL("../", import.meta.url);
const tracePath = new URL("../apps/web/.next/server/app/api/publish/route.js.nft.json", import.meta.url);
const trace = JSON.parse(await readFile(tracePath, "utf8"));
if (!Array.isArray(trace.files)) throw new Error("Publish route trace has no file list.");

const workerEntries = trace.files.filter((file) => /compile-worker\.bundle\.[a-f0-9]+\.js$/.test(file));
if (workerEntries.length !== 1) throw new Error(`Expected one traced server compile worker; received ${workerEntries.length}.`);
const workerPath = resolve(dirname(tracePath.pathname), workerEntries[0]);
await access(workerPath);
const workerBytes = (await stat(workerPath)).size;
if (workerBytes < 100_000 || workerBytes > 2_097_152) throw new Error(`Traced server compile worker has an invalid size (${workerBytes} bytes).`);

const tracedChunks = await Promise.all(trace.files
  .filter((file) => /chunks\/[^/]+\.js$/.test(file) && !file.includes("compile-worker.bundle."))
  .map((file) => readFile(resolve(dirname(tracePath.pathname), file), "utf8")));
if (!tracedChunks.some((source) => source.includes(".next/server/chunks"))) {
  throw new Error("Publish route does not resolve the emitted worker asset as a server file.");
}

console.log(JSON.stringify({
  schemaVersion: 1,
  trace: relative(root.pathname, tracePath.pathname),
  worker: relative(root.pathname, workerPath),
  workerBytes,
}, null, 2));
