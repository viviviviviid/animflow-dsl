import { PublishError } from "@animflow-dsl/publish";

import { Presenter } from "@/components/presenter/Presenter";
import { getPublishService } from "@/lib/publish-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublishedPage({ params }: { readonly params: { readonly id: string } }) {
  try {
    const artifact = await getPublishService().get(params.id);
    return <Presenter plan={artifact.plan} published={{ revisionId: artifact.revisionId, expiresAt: artifact.expiresAt, integrityHash: artifact.integrityHash }} title={artifact.title} />;
  } catch (error) {
    const message = error instanceof PublishError ? error.message : "This published revision is unavailable.";
    return <main className="presenter-status"><div><span>AnimFlow public revision</span><h1>Playback stopped</h1><p>{message}</p><a href="/">Open AnimFlow Studio</a></div></main>;
  }
}
