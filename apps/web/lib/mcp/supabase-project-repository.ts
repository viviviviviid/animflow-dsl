import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { compileAnimFlow } from "@animflow-dsl/compiler";
import type {
  AnimFlowProject,
  AnimFlowProjectRepository,
  SaveAnimFlowProjectInput,
} from "@animflow-dsl/mcp";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

interface ProjectRow {
  readonly document_id: string;
  readonly title: string;
  readonly current_revision: number;
  readonly version: number;
  readonly source: string;
  readonly updated_at: string;
}

export interface AuthenticatedMcpContext {
  readonly accountLabel: string;
  readonly clientId: string;
  readonly repository: AnimFlowProjectRepository;
}

export async function authenticateMcpRequest(request: Request): Promise<AuthenticatedMcpContext> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new McpAuthenticationError("A Bearer access token is required.");

  const config = getPublicSupabaseConfig();
  if (!config) throw new McpAuthenticationError("Supabase OAuth is not configured.", 503);
  const token = match[1]!;
  const client = createClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [{ data: userData, error: userError }, { data: claimData, error: claimError }] = await Promise.all([
    client.auth.getUser(token),
    client.auth.getClaims(token),
  ]);
  if (userError || !userData.user || claimError || !claimData?.claims) {
    throw new McpAuthenticationError("The access token is invalid or expired.");
  }

  const claims = claimData.claims as Record<string, unknown>;
  const clientId = typeof claims.client_id === "string" ? claims.client_id : undefined;
  if (!clientId) throw new McpAuthenticationError("Use an OAuth client token to access MCP.", 403);
  const trustedClientId = process.env.ANIMFLOW_MCP_OAUTH_CLIENT_ID;
  if (trustedClientId && clientId !== trustedClientId) {
    throw new McpAuthenticationError("This OAuth client is not approved for AnimFlow MCP.", 403);
  }
  const expectedIssuer = `${config.url.replace(/\/$/, "")}/auth/v1`;
  if (claims.iss !== expectedIssuer || claims.aud !== "authenticated") {
    throw new McpAuthenticationError("The access token was not issued for this AnimFlow Supabase project.", 403);
  }

  return {
    accountLabel: userData.user.email ?? userData.user.id,
    clientId,
    repository: createRepository(client, userData.user.id),
  };
}

export class McpAuthenticationError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = "McpAuthenticationError";
  }
}

function createRepository(client: SupabaseClient<any>, ownerId: string): AnimFlowProjectRepository {
  return {
    async list() {
      const { data, error } = await client
        .from("animflow_projects")
        .select("document_id,title,current_revision,version,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data as readonly Omit<ProjectRow, "source">[]).map((row) => ({
        currentRevision: Number(row.current_revision),
        documentId: row.document_id,
        title: row.title,
        updatedAt: row.updated_at,
        version: Number(row.version),
      }));
    },
    async get(documentId: string) {
      const { data, error } = await client
        .from("animflow_projects")
        .select("document_id,title,current_revision,version,source,updated_at")
        .eq("document_id", documentId)
        .maybeSingle();
      if (error) throw error;
      return data ? toProject(data as ProjectRow) : null;
    },
    async save(input: SaveAnimFlowProjectInput) {
      return saveProject(client, ownerId, input);
    },
  };
}

async function saveProject(client: SupabaseClient<any>, ownerId: string, input: SaveAnimFlowProjectInput): Promise<AnimFlowProject> {
  const bytes = new TextEncoder().encode(input.source).byteLength;
  if (bytes > 2_097_152) throw new Error("AnimFlow source exceeds the 2 MiB project limit.");
  const compiled = await compileAnimFlow(input.source);
  if (!compiled.ok) {
    const first = compiled.diagnostics.find((diagnostic) => diagnostic.severity === "error")
      ?? compiled.diagnostics[0];
    throw new Error(first
      ? `AnimFlow validation failed (${first.code}) at line ${first.range.start.line + 1}: ${first.message}`
      : "AnimFlow validation failed.");
  }

  if (input.expectedVersion === undefined) {
    const { data, error } = await client.from("animflow_projects").insert({
      current_revision: 0,
      document_id: input.documentId,
      owner_id: ownerId,
      source: input.source,
      title: input.title,
      version: 1,
    }).select("document_id,title,current_revision,version,source,updated_at").single();
    if (error?.code === "23505") throw new Error("Project already exists. Read it and retry with expectedVersion.");
    if (error) throw error;
    return toProject(data as ProjectRow);
  }

  const current = await readVersionedProject(client, input.documentId);
  if (!current) throw new Error("Project was not found. Omit expectedVersion to create it.");
  if (current.version !== input.expectedVersion) {
    throw new Error(`Version conflict: expected ${input.expectedVersion}, current version is ${current.version}. Read the project again before editing.`);
  }
  const { data, error } = await client.from("animflow_projects").update({
    current_revision: current.currentRevision + 1,
    source: input.source,
    title: input.title,
    updated_at: new Date().toISOString(),
    version: current.version + 1,
  }).eq("document_id", input.documentId)
    .eq("version", input.expectedVersion)
    .select("document_id,title,current_revision,version,source,updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Version conflict: another editor changed this project. Read it again before editing.");
  return toProject(data as ProjectRow);
}

async function readVersionedProject(client: SupabaseClient<any>, documentId: string): Promise<AnimFlowProject | null> {
  const { data, error } = await client.from("animflow_projects")
    .select("document_id,title,current_revision,version,source,updated_at")
    .eq("document_id", documentId)
    .maybeSingle();
  if (error) throw error;
  return data ? toProject(data as ProjectRow) : null;
}

function toProject(row: ProjectRow): AnimFlowProject {
  return {
    currentRevision: Number(row.current_revision),
    documentId: row.document_id,
    source: row.source,
    title: row.title,
    updatedAt: row.updated_at,
    version: Number(row.version),
  };
}
