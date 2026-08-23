import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    bin: "src/bin.ts",
    index: "src/index.ts",
  },
  clean: true,
  dts: true,
  format: ["esm"],
  noExternal: [/^@animflow-dsl\//],
  platform: "node",
  sourcemap: true,
  splitting: false,
  target: "node18",
});
