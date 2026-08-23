import "server-only";

import { isIP } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { FilePublishStore, PublishError, PublishService, WorkerCompiler, sha256 } from "@animflow-dsl/publish";

let service: PublishService | undefined;

export function getPublishService(): PublishService {
  if (service) return service;
  const storageDirectory = process.env.ANIMFLOW_PUBLISH_STORAGE_DIR;
  if (!storageDirectory) throw new PublishError("storage-unavailable", "Publishing is not configured on this deployment.", 503);
  if (process.env.NODE_ENV === "production" && !process.env.ANIMFLOW_ABUSE_CONTACT) throw new PublishError("storage-unavailable", "Anonymous publishing requires an abuse contact.", 503);
  const workerPath = process.env.ANIMFLOW_COMPILE_WORKER_PATH ?? resolve(process.cwd(), process.cwd().endsWith("apps/web") ? "../../packages/publish/dist/compile-worker.bundle.js" : "packages/publish/dist/compile-worker.bundle.js");
  service = new PublishService({
    store: new FilePublishStore(storageDirectory),
    compiler: new WorkerCompiler({ workerUrl: pathToFileURL(workerPath) }),
  });
  return service;
}

export function clientKey(headers: Headers): string {
  let address = "anonymous-shared";
  if (process.env.ANIMFLOW_TRUST_PROXY_HEADERS === "true") {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
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
