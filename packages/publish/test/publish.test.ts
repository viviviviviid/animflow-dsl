import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { compileAnimFlow } from "@animflow-dsl/compiler";
import type { RenderPlan } from "@animflow-dsl/model";

import {
  FilePublishStore,
  MAX_SOURCE_BYTES,
  PublishError,
  PublishService,
  WorkerCompiler,
  sha256,
  signArtifact,
  verifyArtifact,
  type ServerCompiler,
} from "../src/index.js";

const roots: string[] = [];
const SOURCE = await readFile(new URL("../../language/fixtures/valid/basic.animflow", import.meta.url), "utf8");

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("server compile isolation", () => {
  it("formats and compiles in a fresh worker", async () => {
    const compiler = new WorkerCompiler({ workerUrl: new URL("../dist/compile-worker.bundle.js", import.meta.url) });
    const result = await compiler.compile(SOURCE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source.endsWith("\n")).toBe(true);
      expect(result.plan.storyId).toBe("checkoutStory");
      expect(Object.isFrozen(result.plan)).toBe(true);
    }
  });

  it("terminates timed-out and crashed jobs and accepts the next job", async () => {
    const compiler = new WorkerCompiler({ concurrency: 1, timeoutMs: 500, workerUrl: new URL("./fixtures/compile-worker.mjs", import.meta.url) });
    await expect(compiler.compile("hang")).rejects.toMatchObject({ code: "compile-timeout" });
    expect((await compiler.compile("ok")).ok).toBe(true);
    await expect(compiler.compile("crash")).rejects.toMatchObject({ code: "compile-failed" });
    expect((await compiler.compile("again")).ok).toBe(true);
  });

  it("rejects work beyond the configured queue", async () => {
    const compiler = new WorkerCompiler({ concurrency: 1, maxQueue: 0, timeoutMs: 500, workerUrl: new URL("./fixtures/compile-worker.mjs", import.meta.url) });
    const active = compiler.compile("hang");
    await expect(compiler.compile("overflow")).rejects.toMatchObject({ code: "compile-overloaded" });
    await expect(active).rejects.toMatchObject({ code: "compile-timeout" });
  });
});

describe("immutable publish revisions", () => {
  it("stores a verifiable revision and deletes only with its token", async () => {
    const { service } = await setupService();
    const receipt = await service.publish({ source: SOURCE, title: "  Demo\u0000 title  ", documentId: "lesson", clientKey: "client-a" });
    expect(receipt.artifact.title).toBe("Demo  title");
    expect(receipt.artifact.revisionId).toMatch(/^[a-f0-9]{32}$/);
    expect(verifyArtifact(receipt.artifact)).toBe(true);
    expect((await service.get(receipt.artifact.revisionId)).integrityHash).toBe(receipt.artifact.integrityHash);
    await expect(service.delete(receipt.artifact.revisionId, "wrong")).rejects.toMatchObject({ code: "forbidden" });
    await service.delete(receipt.artifact.revisionId, receipt.deletionToken);
    await expect(service.get(receipt.artifact.revisionId)).rejects.toMatchObject({ code: "not-found" });
  });

  it("detects tampering instead of recompiling", async () => {
    const { root, service } = await setupService();
    const receipt = await service.publish({ source: SOURCE, clientKey: "client-b" });
    const path = join(root, "revisions", `${receipt.artifact.revisionId}.json`);
    const record = JSON.parse(await readFile(path, "utf8"));
    record.artifact.title = "tampered";
    await writeFile(path, JSON.stringify(record));
    await expect(service.get(receipt.artifact.revisionId)).rejects.toMatchObject({ code: "artifact-corrupt" });
  });

  it("never overwrites an existing revision", async () => {
    const root = await temporaryRoot();
    const store = new FilePublishStore(root);
    const plan = await validPlan();
    const artifact = signArtifact({ schemaVersion: 1, revisionId: "a".repeat(32), createdAt: new Date(0).toISOString(), expiresAt: new Date(10_000).toISOString(), title: "first", source: SOURCE, storyId: "main", versions: { source: "2.1", compiler: "0.1.0", runtime: "0.1.0", renderPlan: 2 }, plan });
    await store.create({ artifact, deletionTokenHash: sha256("token") });
    await expect(store.create({ artifact: { ...artifact, title: "second" }, deletionTokenHash: sha256("token") })).rejects.toMatchObject({ code: "storage-unavailable" });
    expect((await store.get(artifact.revisionId))?.artifact.title).toBe("first");
  });

  it("expires and cleans retained revisions", async () => {
    let now = 1_000;
    const { root, service } = await setupService(() => now, 100);
    const receipt = await service.publish({ source: SOURCE, clientKey: "client-c" });
    now = 1_101;
    await expect(service.get(receipt.artifact.revisionId)).rejects.toMatchObject({ code: "expired" });
    expect(await new FilePublishStore(root).cleanupExpired(now)).toBe(0);
  });

  it("enforces source and anonymous publish quotas before compilation", async () => {
    const { service, compiler } = await setupService();
    await expect(service.publish({ source: "x".repeat(MAX_SOURCE_BYTES + 1), clientKey: "large" })).rejects.toMatchObject({ code: "resource-limit" });
    expect(compiler.calls).toBe(0);
    for (let index = 0; index < 10; index += 1) await service.publish({ source: SOURCE, clientKey: "quota" });
    await expect(service.publish({ source: SOURCE, clientKey: "quota" })).rejects.toMatchObject({ code: "rate-limited", status: 429 });
    expect(compiler.calls).toBe(10);
  });
});

class StubCompiler implements ServerCompiler {
  calls = 0;
  constructor(readonly plan: RenderPlan) {}
  async compile(source: string) { this.calls += 1; return { ok: true as const, source: `${source.trimEnd()}\n`, plan: this.plan }; }
}

async function setupService(now: () => number = () => 1_000, retentionMs = 30 * 86_400_000) {
  const root = await temporaryRoot();
  const compiler = new StubCompiler(await validPlan());
  return { root, compiler, service: new PublishService({ store: new FilePublishStore(root), compiler, now, retentionMs }) };
}

async function validPlan(): Promise<RenderPlan> {
  const result = await compileAnimFlow(SOURCE);
  if (!result.ok) throw new PublishError("compile-failed", "Test fixture failed.", 500, result.diagnostics);
  return result.value;
}

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "animflow-publish-"));
  roots.push(root);
  return root;
}
