import { createHash, timingSafeEqual } from "node:crypto";

import type { PublishedArtifact, PublishedArtifactPayload } from "./types.js";

export function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item ?? null)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function signArtifact(payload: PublishedArtifactPayload): PublishedArtifact {
  return Object.freeze({ ...payload, integrityHash: sha256(stableSerialize(payload)) });
}

export function verifyArtifact(artifact: PublishedArtifact): boolean {
  const { integrityHash, ...payload } = artifact;
  return safeHashEqual(integrityHash, sha256(stableSerialize(payload)));
}

export function safeHashEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
