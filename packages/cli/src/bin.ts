#!/usr/bin/env node
import { createNodeCliIo, runCli } from "./run.js";

process.exitCode = await runCli(process.argv.slice(2), createNodeCliIo());
