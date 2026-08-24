import { access, chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageDirectory, "../..");
const sourceDirectory = join(repositoryRoot, "skills/animflow-authoring");
const outputDirectory = join(packageDirectory, "dist/animflow-authoring");
const cliBundle = join(repositoryRoot, "packages/cli/dist/bin.js");
const packageJson = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));

await access(join(sourceDirectory, "SKILL.md"));
await access(cliBundle).catch(() => {
  throw new Error("AnimFlow CLI bundle is missing. Run `pnpm --filter @animflow-dsl/cli build` first.");
});

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of ["SKILL.md", "agents", "examples", "references", "scripts"]) {
  await cp(join(sourceDirectory, entry), join(outputDirectory, entry), { recursive: true });
}

const vendorDirectory = join(outputDirectory, "vendor");
const bundledCli = join(vendorDirectory, "animflow-cli.js");
await mkdir(vendorDirectory, { recursive: true });
await cp(cliBundle, bundledCli);
await chmod(bundledCli, 0o755);

for (const script of ["run-cli.sh", "validate-example.sh"]) {
  await chmod(join(outputDirectory, "scripts", script), 0o755);
}

await writeFile(
  join(outputDirectory, ".animflow-skill-package.json"),
  `${JSON.stringify({
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    skillName: "animflow-authoring",
  }, null, 2)}\n`,
);

console.log(`Built ${packageJson.name}@${packageJson.version} payload in ${outputDirectory}`);
