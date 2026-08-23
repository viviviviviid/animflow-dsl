import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../dist/index.js", import.meta.url);
const source = await readFile(path, "utf8");
if (!source.startsWith('"use client";')) await writeFile(path, `"use client";\n${source}`);
