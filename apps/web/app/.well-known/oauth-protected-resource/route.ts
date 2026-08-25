import { protectedResourceMetadata } from "@/lib/mcp/protected-resource";

export function GET(request: Request) {
  return protectedResourceMetadata(request);
}
