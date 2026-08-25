import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface AnimFlowProject {
  readonly documentId: string;
  readonly title: string;
  readonly currentRevision: number;
  readonly version: number;
  readonly source: string;
  readonly updatedAt: string;
}

export interface SaveAnimFlowProjectInput {
  readonly documentId: string;
  readonly title: string;
  readonly source: string;
  readonly expectedVersion?: number;
}

export interface AnimFlowProjectRepository {
  list(): Promise<readonly Omit<AnimFlowProject, "source">[]>;
  get(documentId: string): Promise<AnimFlowProject | null>;
  save(input: SaveAnimFlowProjectInput): Promise<AnimFlowProject>;
}

export interface AnimFlowSourceFinding {
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly line?: number;
}

export interface AnimFlowNarrationCue {
  readonly durationMs: number;
  readonly estimatedSpeechMs: number;
  readonly sceneId: string;
  readonly startMs: number;
  readonly text: string;
}

export interface AnimFlowSourceInspection {
  readonly durationMs?: number;
  readonly elementCount?: number;
  readonly findings: readonly AnimFlowSourceFinding[];
  readonly narrationCues: readonly AnimFlowNarrationCue[];
  readonly ok: boolean;
  readonly sceneCount?: number;
}

export interface CreateAnimFlowMcpServerOptions {
  readonly repository: AnimFlowProjectRepository;
  readonly accountLabel?: string;
  readonly inspectSource?: (source: string) => Promise<AnimFlowSourceInspection>;
}

export function createAnimFlowMcpServer(options: CreateAnimFlowMcpServerOptions): McpServer {
  const server = new McpServer({ name: "animflow-studio", version: "0.1.0" });

  server.registerTool("animflow_capabilities", {
    title: "AnimFlow capabilities",
    description: "Describe the authenticated AnimFlow Studio MCP surface before editing a lesson.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, async () => textResult({
    account: options.accountLabel ?? "authenticated-user",
    authoringModel: "full-source optimistic cloud versions",
    language: "AnimFlow DSL 2.2",
    tools: [
      "animflow_list_projects",
      "animflow_get_project",
      ...(options.inspectSource ? ["animflow_inspect_source"] : []),
      "animflow_put_project",
    ],
    workflow: [
      "List projects before choosing a target.",
      "Read the latest source and revision before editing.",
      ...(options.inspectSource ? ["Inspect the complete candidate source before saving."] : []),
      "Send expectedVersion with every update.",
      "Keep node IDs stable so animation targets remain valid.",
    ],
  }));

  server.registerTool("animflow_list_projects", {
    title: "List AnimFlow projects",
    description: "List the signed-in user's private Studio projects without returning source code.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, async () => textResult({ projects: await options.repository.list() }));

  server.registerTool("animflow_get_project", {
    title: "Read an AnimFlow project",
    description: "Read the latest title, revision, and complete AnimFlow DSL source for one private project.",
    inputSchema: {
      documentId: z.string().min(1).max(160).describe("Stable document ID returned by animflow_list_projects"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, async ({ documentId }) => {
    const project = await options.repository.get(documentId);
    return project ? textResult(project) : errorResult(`Project ${documentId} was not found.`);
  });

  if (options.inspectSource) {
    server.registerTool("animflow_inspect_source", {
      title: "Inspect AnimFlow source",
      description: "Compile complete AnimFlow DSL without saving it. Returns diagnostics, geometry collisions, hidden-edge checks, and narration timing cues suitable for per-scene TTS generation.",
      inputSchema: {
        source: z.string().min(1).max(2_097_152),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async ({ source }) => textResult(await options.inspectSource!(source)));
  }

  server.registerTool("animflow_put_project", {
    title: "Create or update an AnimFlow project",
    description: "Store complete AnimFlow DSL source. Existing projects require expectedVersion to prevent overwriting newer user or agent edits.",
    inputSchema: {
      documentId: z.string().min(1).max(160),
      expectedVersion: z.number().int().min(1).optional(),
      source: z.string().min(1).max(2_097_152),
      title: z.string().min(1).max(240),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async (input) => {
    try {
      return textResult(await options.repository.save(input));
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : String(error));
    }
  });

  return server;
}

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
