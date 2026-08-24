import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { compileAnimFlow } from "@animflow-dsl/compiler";

import {
  PublishError,
  SupabasePublishStore,
  sha256,
  signArtifact,
  type StoredPublishedRevision,
} from "../src/index.js";

const SOURCE = await readFile(new URL("../../language/fixtures/valid/basic.animflow", import.meta.url), "utf8");

describe("SupabasePublishStore", () => {
  it("creates immutable rows with a server-only API key", async () => {
    const requests: CapturedRequest[] = [];
    const store = setupStore(requests, [new Response(null, { status: 201 })]);
    await store.create(await record());

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("https://project.supabase.co/rest/v1/animflow_published_revisions");
    expect(requests[0]?.init.method).toBe("POST");
    const headers = new Headers(requests[0]?.init.headers);
    expect(headers.get("apikey")).toBe("sb_secret_test");
    expect(headers.has("authorization")).toBe(false);
    const body = JSON.parse(String(requests[0]?.init.body));
    expect(body.revision_id).toBe("a".repeat(32));
    expect(body.artifact_size).toBeGreaterThan(0);
  });

  it("reads and deletes a revision through bounded filters", async () => {
    const stored = await record();
    const requests: CapturedRequest[] = [];
    const store = setupStore(requests, [
      Response.json([{ artifact: stored.artifact, deletion_token_hash: stored.deletionTokenHash }]),
      new Response(null, { status: 204 }),
    ]);

    await expect(store.get(stored.artifact.revisionId)).resolves.toEqual(stored);
    await store.delete(stored.artifact.revisionId);
    expect(requests[0]?.url).toContain(`revision_id=eq.${stored.artifact.revisionId}`);
    expect(requests[0]?.url).toContain("select=artifact%2Cdeletion_token_hash");
    expect((requests[0]?.init as RequestInit & { cache?: string }).cache).toBe("no-store");
    expect(requests[1]?.init.method).toBe("DELETE");
  });

  it("uses atomic RPCs for hashed quotas and cleanup", async () => {
    const requests: CapturedRequest[] = [];
    const store = setupStore(requests, [Response.json([{ allowed: false, retry_after_ms: 750 }]), Response.json(3)]);

    await expect(store.consumeLimit({ scope: "publish-minute", key: "private-client", limit: 10, windowMs: 60_000, now: 1_000 }))
      .resolves.toEqual({ allowed: false, retryAfterMs: 750 });
    await expect(store.cleanupExpired(2_000)).resolves.toBe(3);
    const quotaBody = JSON.parse(String(requests[0]?.init.body));
    expect(quotaBody.p_key_hash).toBe(sha256("publish-minute\0private-client"));
    expect(JSON.stringify(quotaBody)).not.toContain("private-client");
    expect(requests[1]?.url.endsWith("/rest/v1/rpc/animflow_cleanup_expired_revisions")).toBe(true);
  });

  it("maps duplicate, malformed, and network failures to typed errors", async () => {
    const duplicate = setupStore([], [new Response(null, { status: 409 })]);
    await expect(duplicate.create(await record())).rejects.toMatchObject({ code: "storage-unavailable", status: 503 });

    const malformed = setupStore([], [Response.json({ unexpected: true })]);
    await expect(malformed.get("a".repeat(32))).rejects.toMatchObject({ code: "artifact-corrupt", status: 409 });

    const unreachable = new SupabasePublishStore({
      url: "https://project.supabase.co",
      secretKey: "sb_secret_test",
      fetch: async () => { throw new Error("secret network detail"); },
    });
    await expect(unreachable.get("a".repeat(32))).rejects.toMatchObject({ code: "storage-unavailable", message: "Supabase publish storage is unreachable." });
  });

  it("rejects public keys, invalid URLs, IDs, and timeout configuration", async () => {
    expect(() => new SupabasePublishStore({ url: "https://project.supabase.co", secretKey: "sb_publishable_test" })).toThrow(PublishError);
    expect(() => new SupabasePublishStore({ url: "https://project.supabase.co", secretKey: "legacy-service-role-key" })).toThrow(PublishError);
    expect(() => new SupabasePublishStore({ url: "file:///tmp/data", secretKey: "sb_secret_test" })).toThrow(PublishError);
    expect(() => new SupabasePublishStore({ url: "https://project.supabase.co", secretKey: "sb_secret_test", requestTimeoutMs: 10 })).toThrow(PublishError);
    const store = setupStore([], []);
    await expect(store.get("../revision")).rejects.toBeInstanceOf(PublishError);
  });
});

interface CapturedRequest { readonly url: string; readonly init: RequestInit; }

function setupStore(requests: CapturedRequest[], responses: Response[]): SupabasePublishStore {
  return new SupabasePublishStore({
    url: "https://project.supabase.co",
    secretKey: "sb_secret_test",
    fetch: async (input, init = {}) => {
      requests.push({ url: String(input), init });
      const response = responses.shift();
      if (!response) throw new Error("Unexpected request");
      return response;
    },
  });
}

async function record(): Promise<StoredPublishedRevision> {
  const compiled = await compileAnimFlow(SOURCE);
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.diagnostics));
  const artifact = signArtifact({
    schemaVersion: 1,
    revisionId: "a".repeat(32),
    createdAt: new Date(1_000).toISOString(),
    expiresAt: new Date(61_000).toISOString(),
    title: "Supabase test",
    source: SOURCE,
    storyId: String(compiled.value.storyId),
    versions: { source: "2.1", compiler: "0.1.0", runtime: "0.1.0", renderPlan: 2 },
    plan: compiled.value,
  });
  return { artifact, deletionTokenHash: sha256("delete-token") };
}
