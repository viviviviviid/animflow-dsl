"use client";

import { useEffect, useState } from "react";
import { createBrowserCompileClient } from "@animflow-dsl/browser-worker";
import type { RenderPlan } from "@animflow-dsl/model";

import { loadStudioDraft } from "@/lib/studio-store";
import { Presenter } from "./Presenter";

export function LocalPresenter() {
  const [state, setState] = useState<{ readonly title: string; readonly plan: RenderPlan } | { readonly error: string }>();
  useEffect(() => {
    const client = createBrowserCompileClient();
    let cancelled = false;
    void (async () => {
      const documentId = localStorage.getItem("animflow-studio-document") ?? "local-lesson";
      const draft = await loadStudioDraft(documentId);
      if (!draft) throw new Error("No local Studio draft was found.");
      const result = await client.compile(draft.source).result;
      if (cancelled) return;
      if (result.status !== "success") throw new Error(result.status === "failure" ? result.diagnostics[0]?.message ?? "The local draft does not compile." : "Compile was interrupted.");
      setState({ title: draft.title, plan: result.plan });
    })().catch((error: unknown) => { if (!cancelled) setState({ error: error instanceof Error ? error.message : String(error) }); });
    return () => { cancelled = true; client.dispose(); };
  }, []);
  if (!state) return <PresenterStatus>Opening your local lesson…</PresenterStatus>;
  if ("error" in state) return <PresenterStatus>{state.error}</PresenterStatus>;
  return <Presenter plan={state.plan} title={state.title} />;
}

function PresenterStatus({ children }: { readonly children: React.ReactNode }) {
  return <main className="presenter-status"><div><span>AnimFlow Presenter</span><p>{children}</p><a href="/">Return to Studio</a></div></main>;
}
