import { readFile } from "node:fs/promises";

const contracts = [
  {
    label: "compiler",
    packagePath: "packages/compiler/package.json",
    sourcePath: "packages/compiler/src/version.ts",
    constant: "ANIMFLOW_COMPILER_VERSION",
  },
  {
    label: "runtime",
    packagePath: "packages/runtime/package.json",
    sourcePath: "packages/runtime/src/version.ts",
    constant: "ANIMFLOW_RUNTIME_VERSION",
  },
  {
    label: "CLI",
    packagePath: "packages/cli/package.json",
    sourcePath: "packages/cli/src/run.ts",
    constant: "ANIMFLOW_CLI_VERSION",
  },
  {
    label: "React SDK",
    packagePath: "packages/sdk-react/package.json",
    sourcePath: "packages/sdk-react/src/index.ts",
    constant: "ANIMFLOW_SDK_VERSION",
  },
];

for (const contract of contracts) {
  const manifest = JSON.parse(await readFile(contract.packagePath, "utf8"));
  const source = await readFile(contract.sourcePath, "utf8");
  const match = source.match(new RegExp(`export const ${contract.constant} = "([^"]+)"`));
  if (!match) throw new Error(`${contract.label} does not export ${contract.constant}.`);
  if (match[1] === "0.0.0") throw new Error(`${contract.label} still advertises placeholder version 0.0.0.`);
  if (manifest.version !== match[1]) {
    throw new Error(
      `${contract.label} package version ${manifest.version} does not match advertised version ${match[1]}.`,
    );
  }
}

const sourceContract = await readFile("packages/model/src/source.ts", "utf8");
if (!sourceContract.includes('"2.2",') || !sourceContract.includes('export type AnimFlowSourceVersion = "2" | "2.1" | "2.2"')) {
  throw new Error("AnimFlow source version contract must retain v2/v2.1 compatibility and canonical v2.2.");
}

const guide = await readFile("docs/dsl-guide.md", "utf8");
const readme = await readFile("README.md", "utf8");
if (!guide.startsWith("# AnimFlow DSL v2.2 Reference") || !readme.includes("animflow 2.2")) {
  throw new Error("Primary documentation must default to AnimFlow 2.2.");
}

console.log("Version contract is consistent: source 2.2, compiler/runtime/CLI/SDK 0.1.0.");
