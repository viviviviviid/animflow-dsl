import { parentPort } from "node:worker_threads";

parentPort.once("message", ({ source }) => {
  if (source === "hang") return;
  if (source === "crash") throw new Error("fixture crash");
  parentPort.postMessage({
    type: "success",
    source,
    plan: {
      version: 2,
      documentId: "doc",
      sourceHash: "a".repeat(64),
      storyId: "main",
      seed: 1,
      durationMs: 0,
      canvas: { width: 1600, height: 900, viewport: { x: 0, y: 0, width: 1600, height: 900 } },
      theme: { name: "default", tokens: {} },
      symbols: [],
      elements: [],
      geometry: [],
      initial: { elements: [], camera: { x: 0, y: 0, width: 1600, height: 900 } },
      scenes: [],
    },
  });
});
