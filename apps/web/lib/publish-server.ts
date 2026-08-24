import "server-only";

import { isIP } from "node:net";
import { pathToFileURL } from "node:url";

import { FilePublishStore, PublishError, PublishService, SupabasePublishStore, WorkerCompiler, sha256, type PublishStore } from "@animflow-dsl/publish";

let service: PublishService | undefined;

export function getPublishService(): PublishService {
  if (service) return service;
  if (process.env.NODE_ENV === "production" && !process.env.ANIMFLOW_ABUSE_CONTACT) throw new PublishError("storage-unavailable", "Anonymous publishing requires an abuse contact.", 503);
  if (process.env.NODE_ENV === "production" && (process.env.ANIMFLOW_RATE_LIMIT_PEPPER?.length ?? 0) < 32) throw new PublishError("storage-unavailable", "Anonymous publishing requires a rate-limit pepper of at least 32 characters.", 503);
  const workerPath = process.env.ANIMFLOW_COMPILE_WORKER_PATH;
  service = new PublishService({
    store: createPublishStore(),
    compiler: new WorkerCompiler(workerPath ? { workerUrl: pathToFileURL(workerPath) } : undefined),
  });
  return service;
}

function createPublishStore(): PublishStore {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (supabaseUrl || supabaseSecretKey) {
    if (!supabaseUrl || !supabaseSecretKey) throw new PublishError("storage-unavailable", "Both SUPABASE_URL and SUPABASE_SECRET_KEY are required.", 503);
    if (process.env.NODE_ENV === "production" && !supabaseUrl.startsWith("https://")) throw new PublishError("storage-unavailable", "Production Supabase storage requires HTTPS.", 503);
    return new SupabasePublishStore({ url: supabaseUrl, secretKey: supabaseSecretKey });
  }
  if (process.env.VERCEL === "1") throw new PublishError("storage-unavailable", "Vercel publishing requires Supabase storage.", 503);
  const storageDirectory = process.env.ANIMFLOW_PUBLISH_STORAGE_DIR;
  if (!storageDirectory) throw new PublishError("storage-unavailable", "Publishing is not configured on this deployment.", 503);
  return new FilePublishStore(storageDirectory);
}

export function clientKey(headers: Headers): string {
  let address = "anonymous-shared";
  if (process.env.VERCEL === "1" || process.env.ANIMFLOW_TRUST_PROXY_HEADERS === "true") {
    const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "x-forwarded-for";
    const forwarded = headers.get(header)?.split(",")[0]?.trim();
    if (forwarded && isIP(forwarded)) address = forwarded;
  }
  return sha256(`${process.env.ANIMFLOW_RATE_LIMIT_PEPPER ?? "animflow-public"}\0${address}`);
}

export function publishErrorResponse(error: unknown): Response {
  const known = error instanceof PublishError ? error : new PublishError("storage-unavailable", "Publishing is temporarily unavailable.", 503);
  return Response.json({ error: { code: known.code, message: known.message, diagnostics: known.diagnostics } }, {
    status: known.status,
    headers: {
      "Cache-Control": "no-store",
      ...(known.retryAfterMs ? { "Retry-After": String(Math.ceil(known.retryAfterMs / 1_000)) } : {}),
    },
  });
}

export function logRejectedPublish(headers: Headers, error: unknown): void {
  if (!(error instanceof PublishError) || ![400, 413, 429].includes(error.status)) return;
  console.warn(JSON.stringify({ event: "animflow.publish.rejected", client: clientKey(headers).slice(0, 16), code: error.code, status: error.status }));
}
