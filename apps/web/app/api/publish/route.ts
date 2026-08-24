import { MAX_SOURCE_BYTES, PublishError } from "@animflow-dsl/publish";

import { clientKey, getPublishService, logRejectedPublish, publishErrorResponse } from "@/lib/publish-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SOURCE_BYTES + 16_384) throw new PublishError("resource-limit", "Publish request is too large.", 413);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > MAX_SOURCE_BYTES + 16_384) throw new PublishError("resource-limit", "Publish request is too large.", 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new PublishError("invalid-request", "Publish body must be valid JSON.", 400); }
    if (!body || typeof body !== "object") throw new PublishError("invalid-request", "Publish body must be an object.", 400);
    const input = body as Record<string, unknown>;
    const receipt = await getPublishService().publish({
      source: typeof input.source === "string" ? input.source : "",
      title: typeof input.title === "string" ? input.title : undefined,
      documentId: typeof input.documentId === "string" ? input.documentId : undefined,
      clientKey: clientKey(request.headers),
    });
    return Response.json({
      id: receipt.artifact.revisionId,
      url: `/p/${receipt.artifact.revisionId}`,
      deletionToken: receipt.deletionToken,
      expiresAt: receipt.artifact.expiresAt,
      integrityHash: receipt.artifact.integrityHash,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logRejectedPublish(request.headers, error);
    return publishErrorResponse(error);
  }
}
