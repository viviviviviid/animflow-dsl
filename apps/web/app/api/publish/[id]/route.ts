import { PublishError } from "@animflow-dsl/publish";

import { getPublishService, publishErrorResponse } from "@/lib/publish-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: { id: string } }): Promise<Response> {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) throw new PublishError("forbidden", "A deletion token is required.", 403);
    await getPublishService().delete(context.params.id, authorization.slice(7));
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return publishErrorResponse(error);
  }
}
