import { createHash, randomUUID } from "node:crypto";
import { link, mkdir, open, readFile, readdir, rename, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

import { MAX_ARTIFACT_BYTES, PublishError, type PublishStore, type StoredPublishedRevision } from "./types.js";

const REVISION_ID = /^[a-f0-9]{32}$/;

export class FilePublishStore implements PublishStore {
  readonly #root: string;

  constructor(root: string) {
    if (!root.trim()) throw new PublishError("storage-unavailable", "Publish storage directory is not configured.", 503);
    this.#root = root;
  }

  async create(record: StoredPublishedRevision): Promise<void> {
    this.#assertId(record.artifact.revisionId);
    await this.#ensureDirectories();
    const serialized = JSON.stringify(record);
    if (Buffer.byteLength(serialized) > MAX_ARTIFACT_BYTES) throw new PublishError("resource-limit", "Published revision exceeds 2 MiB.", 413);
    const target = this.#revisionPath(record.artifact.revisionId);
    const temporary = join(this.#root, "tmp", `${record.artifact.revisionId}-${randomUUID()}.json`);
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(serialized, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await link(temporary, target);
    } catch (error) {
      throw new PublishError("storage-unavailable", `Could not create immutable revision: ${error instanceof Error ? error.message : String(error)}`, 503);
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
  }

  async get(revisionId: string): Promise<StoredPublishedRevision | null> {
    this.#assertId(revisionId);
    try {
      const raw = await readFile(this.#revisionPath(revisionId), "utf8");
      if (Buffer.byteLength(raw) > MAX_ARTIFACT_BYTES) throw new PublishError("artifact-corrupt", "Stored revision exceeds its size contract.", 409);
      return JSON.parse(raw) as StoredPublishedRevision;
    } catch (error) {
      if (isCode(error, "ENOENT")) return null;
      if (error instanceof PublishError) throw error;
      throw new PublishError("artifact-corrupt", "Stored revision is unreadable.", 409);
    }
  }

  async delete(revisionId: string): Promise<void> {
    this.#assertId(revisionId);
    await unlink(this.#revisionPath(revisionId)).catch((error: unknown) => {
      if (!isCode(error, "ENOENT")) throw error;
    });
  }

  async cleanupExpired(now: number): Promise<number> {
    await this.#ensureDirectories();
    let deleted = 0;
    for (const name of await readdir(join(this.#root, "revisions"))) {
      if (!name.endsWith(".json") || !REVISION_ID.test(name.slice(0, -5))) continue;
      try {
        const revisionPath = join(this.#root, "revisions", name);
        const record = JSON.parse(await readFile(revisionPath, "utf8")) as StoredPublishedRevision;
        if (Date.parse(record.artifact.expiresAt) <= now) {
          await unlink(revisionPath);
          deleted += 1;
        }
      } catch {
        // Corrupt records remain available for explicit operator inspection.
      }
    }
    return deleted;
  }

  async consumeLimit(input: { readonly scope: string; readonly key: string; readonly limit: number; readonly windowMs: number; readonly now: number }): Promise<{ readonly allowed: boolean; readonly retryAfterMs: number }> {
    await this.#ensureDirectories();
    const id = createHash("sha256").update(`${input.scope}\0${input.key}`).digest("hex");
    const statePath = join(this.#root, "rates", `${id}.json`);
    const release = await acquireLock(`${statePath}.lock`);
    try {
      let state = { windowStart: input.now, count: 0 };
      try { state = JSON.parse(await readFile(statePath, "utf8")) as typeof state; } catch (error) { if (!isCode(error, "ENOENT")) throw error; }
      if (input.now - state.windowStart >= input.windowMs || input.now < state.windowStart) state = { windowStart: input.now, count: 0 };
      const allowed = state.count < input.limit;
      if (allowed) state.count += 1;
      const temporary = `${statePath}.${randomUUID()}.tmp`;
      const handle = await open(temporary, "wx", 0o600);
      try { await handle.writeFile(JSON.stringify(state), "utf8"); await handle.sync(); } finally { await handle.close(); }
      await rename(temporary, statePath);
      return { allowed, retryAfterMs: Math.max(1, state.windowStart + input.windowMs - input.now) };
    } finally {
      await release();
    }
  }

  #revisionPath(revisionId: string): string { return join(this.#root, "revisions", `${revisionId}.json`); }
  #assertId(revisionId: string): void { if (!REVISION_ID.test(revisionId)) throw new PublishError("invalid-request", "Invalid revision ID.", 400); }
  async #ensureDirectories(): Promise<void> { await Promise.all([mkdir(join(this.#root, "revisions"), { recursive: true }), mkdir(join(this.#root, "rates"), { recursive: true }), mkdir(join(this.#root, "tmp"), { recursive: true })]); }
}

async function acquireLock(path: string): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const handle = await open(path, "wx", 0o600);
      await handle.close();
      return () => unlink(path).catch(() => undefined);
    } catch (error) {
      if (!isCode(error, "EEXIST")) throw error;
      try { if (Date.now() - (await stat(path)).mtimeMs > 5_000) await unlink(path); } catch { /* another process released it */ }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new PublishError("storage-unavailable", "Rate-limit store is busy.", 503);
}

function isCode(error: unknown, code: string): boolean { return Boolean(error && typeof error === "object" && "code" in error && error.code === code); }
