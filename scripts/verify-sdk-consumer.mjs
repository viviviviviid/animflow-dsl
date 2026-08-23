import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const workspace = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), "animflow-sdk-consumer-"));
const packDirectory = join(temporary, "pack");
const consumer = join(temporary, "consumer");

try {
  await mkdir(packDirectory);
  run("corepack", ["pnpm@9.15.0", "pack", "--pack-destination", packDirectory], join(workspace, "packages", "sdk-react"));
  const tarballs = (await readdir(packDirectory)).filter((name) => name.endsWith(".tgz"));
  if (tarballs.length !== 1) throw new Error(`Expected one SDK tarball; received ${tarballs.join(", ") || "none"}.`);
  const tarball = join(packDirectory, tarballs[0]);
  const listing = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  for (const required of ["package/package.json", "package/README.md", "package/LICENSE", "package/dist/index.js", "package/dist/index.d.ts", "package/dist/worker.js"]) {
    if (!listing.split("\n").includes(required)) throw new Error(`Packed SDK is missing ${required}.`);
  }

  await mkdir(join(consumer, "src"), { recursive: true });
  await writeFile(join(consumer, "package.json"), JSON.stringify({
    name: "animflow-clean-consumer",
    private: true,
    type: "module",
    scripts: { typecheck: "tsc --noEmit", build: "node build.mjs", test: "node test.mjs" },
    dependencies: {
      "@animflow/sdk-react": `file:${tarball}`,
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      esbuild: "0.28.2",
      react: "18.3.1",
      "react-dom": "18.3.1",
      typescript: "5.9.3",
    },
  }, null, 2));
  await writeFile(join(consumer, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2020", lib: ["DOM", "ES2020"], strict: true, module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", noEmit: true }, include: ["src"] }, null, 2));
  const validSource = await readFile(join(workspace, "packages", "language", "fixtures", "valid", "basic.animflow"), "utf8");
  await writeFile(join(consumer, "src", "main.tsx"), `import { AnimFlowPlayer, type AnimFlowDiagnostic } from "@animflow/sdk-react";
import { createRoot } from "react-dom/client";

const source = ${JSON.stringify(validSource)};
const onDiagnostic = (diagnostic: AnimFlowDiagnostic) => console.warn(diagnostic.code);
createRoot(document.getElementById("root")!).render(<AnimFlowPlayer controls onDiagnostic={onDiagnostic} source={source} story="checkoutStory" style={{ height: 540 }} />);
`);
  await writeFile(join(consumer, "build.mjs"), `import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await build({ entryPoints: ["src/main.tsx"], bundle: true, format: "esm", minify: true, outfile: "dist/app.js", platform: "browser", target: "es2020" });
await copyFile("node_modules/@animflow/sdk-react/dist/worker.js", "dist/worker.js");
`);
  await writeFile(join(consumer, "test.mjs"), `import { access, readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnimFlowPlayer, ANIMFLOW_SDK_VERSION } from "@animflow/sdk-react";
const markup = renderToStaticMarkup(createElement(AnimFlowPlayer, { source: "invalid on purpose", ssrPlaceholder: "SSR-safe" }));
if (!markup.includes("SSR-safe") || !markup.includes('data-animflow-sdk="loading"')) throw new Error("SSR placeholder contract failed.");
if (ANIMFLOW_SDK_VERSION !== "0.1.0") throw new Error("Unexpected SDK version.");
await access("dist/worker.js");
const bundled = await readFile("dist/app.js", "utf8");
if (bundled.includes("@animflow-dsl/")) throw new Error("Consumer bundle leaked an internal workspace import.");
const manifest = JSON.parse(await readFile("node_modules/@animflow/sdk-react/package.json", "utf8"));
if (Object.keys(manifest.dependencies ?? {}).some((name) => name.startsWith("@animflow-dsl/"))) throw new Error("Packed manifest leaked an internal workspace dependency.");
const sdkModule = await readFile("node_modules/@animflow/sdk-react/dist/index.js", "utf8");
if (!sdkModule.startsWith('"use client";')) throw new Error("Packed React entry lost its client boundary directive.");
`);

  run("corepack", ["pnpm@9.15.0", "install", "--ignore-workspace", "--no-frozen-lockfile"], consumer);
  run("corepack", ["pnpm@9.15.0", "typecheck"], consumer);
  run("corepack", ["pnpm@9.15.0", "build"], consumer);
  run("corepack", ["pnpm@9.15.0", "test"], consumer);
  await verifyBrowserConsumer(consumer);
  const workerBytes = (await readFile(join(consumer, "dist", "worker.js"))).byteLength;
  if (workerBytes < 100_000) throw new Error(`Consumer worker looks incomplete (${workerBytes} bytes).`);
  console.log(`SDK clean consumer verified from ${tarballs[0]} (${workerBytes} worker bytes).`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });
}

async function verifyBrowserConsumer(consumerDirectory) {
  const requested = new Set();
  const server = createServer(async (request, response) => {
    const path = request.url === "/" ? "index.html" : request.url?.slice(1);
    if (!path || !["index.html", "app.js", "worker.js"].includes(path)) { response.writeHead(404).end(); return; }
    requested.add(path);
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; object-src 'none'");
    response.setHeader("Content-Type", path.endsWith(".js") ? "text/javascript" : "text/html; charset=utf-8");
    response.end(path === "index.html" ? '<div id="root"></div><script type="module" src="/app.js"></script>' : await readFile(join(consumerDirectory, "dist", path)));
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not bind SDK consumer server.");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForSelector('[data-animflow-sdk="ready"]', { timeout: 10_000 });
    if (await page.locator('svg[role="img"]').count() !== 1) throw new Error("Packed SDK did not render its SVG canvas.");
    if (await page.getByRole("button", { name: "Play animation" }).count() !== 1) throw new Error("Packed SDK controls did not render.");
    if (pageErrors.length) throw new Error(`Packed SDK browser errors: ${pageErrors.join("; ")}`);
    if (!["app.js", "index.html", "worker.js"].every((path) => requested.has(path))) throw new Error(`Unexpected SDK asset requests: ${[...requested].join(", ")}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
