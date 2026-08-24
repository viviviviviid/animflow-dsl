import { sha256 } from "./integrity.js";
import {
  MAX_ARTIFACT_BYTES,
  PublishError,
  type PublishedArtifact,
  type PublishStore,
  type StoredPublishedRevision,
} from "./types.js";

const REVISION_ID = /^[a-f0-9]{32}$/;
const DEFAULT_REQUEST_TIMEOUT_MS = 2_500;

export interface SupabasePublishStoreOptions {
  readonly url: string;
  readonly secretKey: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly requestTimeoutMs?: number;
}

interface RevisionRow {
  readonly artifact: PublishedArtifact;
  readonly deletion_token_hash: string;
}

interface LimitRow {
  readonly allowed: boolean;
  readonly retry_after_ms: number;
}

export class SupabasePublishStore implements PublishStore {
  readonly #baseUrl: URL;
  readonly #secretKey: string;
  readonly #fetch: typeof globalThis.fetch;
  readonly #requestTimeoutMs: number;

  constructor(options: SupabasePublishStoreOptions) {
    this.#baseUrl = parseBaseUrl(options.url);
    this.#secretKey = options.secretKey.trim();
    if (!this.#secretKey.startsWith("sb_secret_")) {
      throw new PublishError("storage-unavailable", "A current server-only Supabase secret key is required.", 503);
    }
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (!this.#fetch) throw new PublishError("storage-unavailable", "Fetch is unavailable in this runtime.", 503);
    this.#requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    if (!Number.isInteger(this.#requestTimeoutMs) || this.#requestTimeoutMs < 100 || this.#requestTimeoutMs > 30_000) {
      throw new PublishError("storage-unavailable", "Supabase request timeout is invalid.", 503);
    }
  }

  async create(record: StoredPublishedRevision): Promise<void> {
    this.#assertId(record.artifact.revisionId);
    const serialized = JSON.stringify(record);
    const artifactSize = Buffer.byteLength(serialized);
    if (artifactSize > MAX_ARTIFACT_BYTES) throw new PublishError("resource-limit", "Published revision exceeds 2 MiB.", 413);
    const response = await this.#request("rest/v1/animflow_published_revisions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        revision_id: record.artifact.revisionId,
        artifact: record.artifact,
        deletion_token_hash: record.deletionTokenHash,
        created_at: record.artifact.createdAt,
        expires_at: record.artifact.expiresAt,
        artifact_size: artifactSize,
      }),
    });
    if (response.status === 409) throw new PublishError("storage-unavailable", "Immutable revision already exists.", 503);
    await assertSuccess(response, "Could not create immutable revision.");
  }

  async get(revisionId: string): Promise<StoredPublishedRevision | null> {
    this.#assertId(revisionId);
    const url = this.#url("rest/v1/animflow_published_revisions");
    url.searchParams.set("revision_id", `eq.${revisionId}`);
    url.searchParams.set("select", "artifact,deletion_token_hash");
    url.searchParams.set("limit", "1");
    const response = await this.#request(url);
    await assertSuccess(response, "Could not read published revision.");
    const body = await readJson(response);
    if (!Array.isArray(body)) throw corruptRevision();
    if (body.length === 0) return null;
    const row = body[0] as Partial<RevisionRow> | undefined;
    if (!row || !isArtifact(row.artifact) || typeof row.deletion_token_hash !== "string") throw corruptRevision();
    return { artifact: row.artifact, deletionTokenHash: row.deletion_token_hash };
  }

  async delete(revisionId: string): Promise<void> {
    this.#assertId(revisionId);
    const url = this.#url("rest/v1/animflow_published_revisions");
    url.searchParams.set("revision_id", `eq.${revisionId}`);
    const response = await this.#request(url, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await assertSuccess(response, "Could not delete published revision.");
  }

  async cleanupExpired(now: number): Promise<number> {
    const response = await this.#request("rest/v1/rpc/animflow_cleanup_expired_revisions", {
      method: "POST",
      body: JSON.stringify({ p_now_ms: normalizeInteger(now, "cleanup timestamp") }),
    });
    await assertSuccess(response, "Could not clean expired revisions.");
    const body = await readJson(response);
    if (!Number.isInteger(body) || (body as number) < 0) throw storageFailure("Supabase returned an invalid cleanup result.");
    return body as number;
  }

  async consumeLimit(input: { readonly scope: string; readonly key: string; readonly limit: number; readonly windowMs: number; readonly now: number }): Promise<{ readonly allowed: boolean; readonly retryAfterMs: number }> {
    const response = await this.#request("rest/v1/rpc/animflow_consume_publish_limit", {
      method: "POST",
      body: JSON.stringify({
        p_scope: input.scope,
        p_key_hash: sha256(`${input.scope}\0${input.key}`),
        p_limit: normalizeInteger(input.limit, "rate limit"),
        p_window_ms: normalizeInteger(input.windowMs, "rate window"),
        p_now_ms: normalizeInteger(input.now, "rate timestamp"),
      }),
    });
    await assertSuccess(response, "Could not enforce publish quota.");
    const body = await readJson(response);
    const row = Array.isArray(body) ? body[0] as Partial<LimitRow> | undefined : undefined;
    const retryAfterMs = row?.retry_after_ms;
    if (!row || typeof row.allowed !== "boolean" || !Number.isInteger(retryAfterMs) || retryAfterMs === undefined || retryAfterMs < 1) {
      throw storageFailure("Supabase returned an invalid rate-limit result.");
    }
    return { allowed: row.allowed, retryAfterMs };
  }

  async #request(path: string | URL, init: RequestInit = {}): Promise<Response> {
    const signal = AbortSignal.timeout(this.#requestTimeoutMs);
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Cache-Control", "no-store");
    headers.set("apikey", this.#secretKey);
    if (init.body) headers.set("Content-Type", "application/json");
    try {
      const uncachedInit = {
        ...init,
        cache: "no-store" as const,
        signal,
        headers,
      };
      return await this.#fetch(typeof path === "string" ? this.#url(path) : path, uncachedInit as RequestInit);
    } catch {
      throw storageFailure("Supabase publish storage is unreachable.");
    }
  }

  #url(path: string): URL { return new URL(path, this.#baseUrl); }
  #assertId(revisionId: string): void {
    if (!REVISION_ID.test(revisionId)) throw new PublishError("invalid-request", "Invalid revision ID.", 400);
  }
}

function parseBaseUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (!(["https:", "http:"].includes(url.protocol)) || url.username || url.password) throw new Error("invalid URL");
    url.pathname = `${url.pathname.replace(/\/*$/, "")}/`;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    throw new PublishError("storage-unavailable", "Supabase URL is invalid.", 503);
  }
}

async function assertSuccess(response: Response, message: string): Promise<void> {
  if (response.ok) return;
  throw storageFailure(`${message} Supabase returned HTTP ${response.status}.`);
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw storageFailure("Supabase returned an invalid JSON response."); }
}

function normalizeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new PublishError("invalid-request", `Invalid ${label}.`, 400);
  return value;
}

function isArtifact(value: unknown): value is PublishedArtifact {
  return Boolean(value && typeof value === "object" && "revisionId" in value && typeof value.revisionId === "string" && "integrityHash" in value && typeof value.integrityHash === "string");
}

function corruptRevision(): PublishError {
  return new PublishError("artifact-corrupt", "Stored revision is unreadable.", 409);
}

function storageFailure(message: string): PublishError {
  return new PublishError("storage-unavailable", message, 503);
}
