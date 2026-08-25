import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createAnimFlowMcpServer } from "@animflow-dsl/mcp";
import { inspectAnimFlowSource } from "@/lib/mcp/inspect-source";
import {
  authenticateMcpRequest,
  McpAuthenticationError,
} from "@/lib/mcp/supabase-project-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const context = await authenticateMcpRequest(request);
    const server = createAnimFlowMcpServer({
      accountLabel: context.accountLabel,
      inspectSource: inspectAnimFlowSource,
      repository: context.repository,
    });
    const transport = new WebStandardStreamableHTTPServerTransport();
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    if (error instanceof McpAuthenticationError) return authError(request, error);
    console.error("AnimFlow MCP request failed.", error);
    return Response.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal MCP error." }, id: null }, { status: 500 });
  }
}

export function GET() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

function authError(request: Request, error: McpAuthenticationError) {
  const metadata = new URL("/.well-known/oauth-protected-resource/api/mcp", request.url);
  return Response.json({ error: error.message }, {
    status: error.status,
    headers: error.status === 401 ? { "WWW-Authenticate": `Bearer resource_metadata="${metadata.toString()}"` } : undefined,
  });
}

function methodNotAllowed() {
  return Response.json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }, { status: 405, headers: { Allow: "POST" } });
}
