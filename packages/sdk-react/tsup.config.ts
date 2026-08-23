import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    worker: "../browser-worker/src/worker.ts",
  },
  clean: true,
  dts: { entry: { index: "src/index.ts" } },
  external: ["react", "react-dom", "react/jsx-runtime"],
  format: ["esm"],
  minify: false,
  noExternal: [/^@animflow-dsl\//],
  platform: "browser",
  sourcemap: true,
  splitting: false,
  target: "es2020",
  treeshake: true,
});
