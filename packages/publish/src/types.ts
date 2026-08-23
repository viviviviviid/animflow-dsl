import type { Diagnostic, RenderPlan } from "@animflow-dsl/model";

export const PUBLISHED_ARTIFACT_VERSION = 1 as const;
export const DEFAULT_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;
export const MAX_SOURCE_BYTES = 256 * 1_024;
export const MAX_ARTIFACT_BYTES = 2 * 1_024 * 1_024;

export interface PublishedArtifactPayload {
  readonly schemaVersion: 1;
  readonly revisionId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly title: string;
  readonly source: string;
  readonly storyId: string;
  readonly versions: {
    readonly source: string;
    readonly compiler: string;
    readonly runtime: string;
    readonly renderPlan: number;
  };
  readonly plan: RenderPlan;
}

export interface PublishedArtifact extends PublishedArtifactPayload {
  readonly integrityHash: string;
}

export interface StoredPublishedRevision {
  readonly artifact: PublishedArtifact;
  readonly deletionTokenHash: string;
}

export interface PublishRequest {
  readonly source: string;
  readonly title?: string;
  readonly documentId?: string;
  readonly clientKey: string;
}

export interface PublishReceipt {
  readonly artifact: PublishedArtifact;
  readonly deletionToken: string;
}

export type ServerCompileResult =
  | { readonly ok: true; readonly source: string; readonly plan: RenderPlan }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };

export interface ServerCompiler {
  compile(source: string): Promise<ServerCompileResult>;
  dispose?(): Promise<void> | void;
}

export interface PublishStore {
  create(record: StoredPublishedRevision): Promise<void>;
  get(revisionId: string): Promise<StoredPublishedRevision | null>;
  delete(revisionId: string): Promise<void>;
  cleanupExpired(now: number): Promise<number>;
  consumeLimit(input: {
    readonly scope: string;
    readonly key: string;
    readonly limit: number;
    readonly windowMs: number;
    readonly now: number;
  }): Promise<{ readonly allowed: boolean; readonly retryAfterMs: number }>;
}

export type PublishErrorCode =
  | "artifact-corrupt"
  | "compile-failed"
  | "compile-overloaded"
  | "compile-timeout"
  | "expired"
  | "forbidden"
  | "invalid-request"
  | "not-found"
  | "rate-limited"
  | "resource-limit"
  | "storage-unavailable"
  | "version-incompatible";

export class PublishError extends Error {
  constructor(
    readonly code: PublishErrorCode,
    message: string,
    readonly status: number,
    readonly diagnostics: readonly Diagnostic[] = [],
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "PublishError";
  }
}
