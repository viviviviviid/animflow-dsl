import { randomBytes } from "node:crypto";

import { ANIMFLOW_COMPILER_VERSION } from "@animflow-dsl/compiler";
import { ANIMFLOW_SOURCE_VERSIONS, RENDER_PLAN_VERSION } from "@animflow-dsl/model";
import { ANIMFLOW_RUNTIME_VERSION } from "@animflow-dsl/runtime";

import { safeHashEqual, sha256, signArtifact, verifyArtifact } from "./integrity.js";
import {
  DEFAULT_RETENTION_MS,
  MAX_SOURCE_BYTES,
  PUBLISHED_ARTIFACT_VERSION,
  PublishError,
  type PublishReceipt,
  type PublishRequest,
  type PublishStore,
  type PublishedArtifact,
  type ServerCompiler,
} from "./types.js";
import { WorkerCompiler } from "./compiler-pool.js";

export interface PublishServiceOptions {
  readonly store: PublishStore;
  readonly compiler?: ServerCompiler;
  readonly now?: () => number;
  readonly retentionMs?: number;
}

export class PublishService {
  readonly #store: PublishStore;
  readonly #compiler: ServerCompiler;
  readonly #now: () => number;
  readonly #retentionMs: number;

  constructor(options: PublishServiceOptions) {
    this.#store = options.store;
    this.#compiler = options.compiler ?? new WorkerCompiler();
    this.#now = options.now ?? Date.now;
    this.#retentionMs = options.retentionMs ?? DEFAULT_RETENTION_MS;
  }

  async publish(request: PublishRequest): Promise<PublishReceipt> {
    validateRequest(request);
    const now = this.#now();
    await this.#enforceLimit("publish-minute", request.clientKey, 10, 60_000, now);
    await this.#enforceLimit("publish-day", request.clientKey, 100, 86_400_000, now);
    if (request.documentId) await this.#enforceLimit("document-day", request.documentId, 100, 86_400_000, now);
    void this.#store.cleanupExpired(now).catch(() => undefined);

    const compiled = await this.#compiler.compile(request.source);
    if (!compiled.ok) throw new PublishError("compile-failed", "AnimFlow source did not compile.", 422, compiled.diagnostics);
    const revisionId = randomBytes(16).toString("hex");
    const deletionToken = randomBytes(32).toString("base64url");
    const artifact = signArtifact({
      schemaVersion: PUBLISHED_ARTIFACT_VERSION,
      revisionId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.#retentionMs).toISOString(),
      title: normalizeTitle(request.title),
      source: compiled.source,
      storyId: String(compiled.plan.storyId),
      versions: {
        source: compiled.plan.authoring?.sourceVersion ?? ANIMFLOW_SOURCE_VERSIONS[0],
        compiler: ANIMFLOW_COMPILER_VERSION,
        runtime: ANIMFLOW_RUNTIME_VERSION,
        renderPlan: RENDER_PLAN_VERSION,
      },
      plan: compiled.plan,
    });
    await this.#store.create({ artifact, deletionTokenHash: sha256(deletionToken) });
    return { artifact, deletionToken };
  }

  async get(revisionId: string): Promise<PublishedArtifact> {
    const record = await this.#store.get(revisionId);
    if (!record) throw new PublishError("not-found", "Published revision was not found.", 404);
    if (Date.parse(record.artifact.expiresAt) <= this.#now()) {
      await this.#store.delete(revisionId);
      throw new PublishError("expired", "Published revision has expired.", 410);
    }
    if (!verifyArtifact(record.artifact)) throw new PublishError("artifact-corrupt", "Published revision failed integrity verification.", 409);
    assertCompatible(record.artifact);
    return record.artifact;
  }

  async delete(revisionId: string, deletionToken: string): Promise<void> {
    const record = await this.#store.get(revisionId);
    if (!record) throw new PublishError("not-found", "Published revision was not found.", 404);
    if (!safeHashEqual(record.deletionTokenHash, sha256(deletionToken))) throw new PublishError("forbidden", "Deletion token is invalid.", 403);
    await this.#store.delete(revisionId);
  }

  async dispose(): Promise<void> { await this.#compiler.dispose?.(); }

  async #enforceLimit(scope: string, key: string, limit: number, windowMs: number, now: number): Promise<void> {
    const result = await this.#store.consumeLimit({ scope, key, limit, windowMs, now });
    if (!result.allowed) throw new PublishError("rate-limited", "Anonymous publish quota exceeded.", 429, [], result.retryAfterMs);
  }
}

function validateRequest(request: PublishRequest): void {
  if (typeof request.source !== "string" || !request.source.trim()) throw new PublishError("invalid-request", "Source is required.", 400);
  if (Buffer.byteLength(request.source) > MAX_SOURCE_BYTES) throw new PublishError("resource-limit", "Source exceeds 256 KiB.", 413);
  if (!request.clientKey || request.clientKey.length > 256) throw new PublishError("invalid-request", "A bounded client key is required.", 400);
  if (request.documentId && request.documentId.length > 128) throw new PublishError("invalid-request", "Document ID is too long.", 400);
}

function normalizeTitle(title: string | undefined): string {
  const normalized = (title ?? "Untitled AnimFlow lesson").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized.slice(0, 160) || "Untitled AnimFlow lesson";
}

function assertCompatible(artifact: PublishedArtifact): void {
  if (artifact.schemaVersion !== PUBLISHED_ARTIFACT_VERSION || artifact.versions.renderPlan !== RENDER_PLAN_VERSION || artifact.versions.runtime !== ANIMFLOW_RUNTIME_VERSION) {
    throw new PublishError("version-incompatible", "This revision requires an unavailable AnimFlow runtime.", 409);
  }
}
