"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StudioDraft } from "@/lib/studio-store";

interface ProjectRow {
  readonly document_id: string;
  readonly title: string;
  readonly current_revision: number;
  readonly version: number;
  readonly source: string;
  readonly updated_at: string;
}

export interface CloudStudioDraft extends StudioDraft {
  readonly cloud: true;
}

export async function listCloudStudioDrafts(): Promise<readonly CloudStudioDraft[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("animflow_projects")
    .select("document_id,title,current_revision,version,source,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as readonly ProjectRow[]).map(toDraft);
}

export async function saveCloudStudioDraft(draft: StudioDraft, ownerId: string): Promise<number> {
  const client = requireClient();
  if (draft.cloudVersion === undefined) {
    const { data: current, error: readError } = await client.from("animflow_projects")
      .select("version,title,source")
      .eq("document_id", draft.documentId)
      .maybeSingle();
    if (readError) throw readError;
    if (current) {
      if (current.source === draft.source && current.title === draft.title) return Number(current.version);
      throw new Error("A cloud copy already exists. Open Projects to load it before syncing this local draft.");
    }
    const { data, error } = await client.from("animflow_projects").insert({
      owner_id: ownerId,
      document_id: draft.documentId,
      title: draft.title,
      current_revision: draft.currentRevision,
      source: draft.source,
      version: 1,
      updated_at: new Date(draft.updatedAt).toISOString(),
    }).select("version").single();
    if (error) throw error;
    return Number(data.version);
  }

  const nextVersion = draft.cloudVersion + 1;
  const { data, error } = await client.from("animflow_projects").update({
    title: draft.title,
    current_revision: draft.currentRevision,
    source: draft.source,
    version: nextVersion,
    updated_at: new Date(draft.updatedAt).toISOString(),
  }).eq("document_id", draft.documentId)
    .eq("version", draft.cloudVersion)
    .select("version")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The cloud project changed elsewhere. Reopen Projects before continuing.");
  return Number(data.version);
}

export async function deleteCloudStudioDraft(documentId: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("animflow_projects")
    .delete()
    .eq("document_id", documentId);
  if (error) throw error;
}

function requireClient() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Cloud projects are not configured for this deployment.");
  return client;
}

function toDraft(row: ProjectRow): CloudStudioDraft {
  return {
    cloud: true,
    cloudVersion: Number(row.version),
    currentRevision: Number(row.current_revision),
    documentId: row.document_id,
    source: row.source,
    title: row.title,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}
