import { expect, test } from "@playwright/test";

test("advertises OAuth metadata when configured and fails closed otherwise", async ({ request }) => {
  const response = await request.get("/.well-known/oauth-protected-resource/api/mcp");
  expect([200, 503]).toContain(response.status());
  const body = await response.json() as { readonly resource?: string; readonly authorization_servers?: readonly string[]; readonly error?: string };
  if (response.ok()) {
    expect(body.resource).toMatch(/\/api\/mcp$/);
    expect(body.authorization_servers?.[0]).toMatch(/\/auth\/v1$/);
  } else {
    expect(body.error).toBe("OAuth is not configured.");
  }
});

test("rejects unauthenticated MCP calls with protected-resource discovery", async ({ request }) => {
  const response = await request.post("/api/mcp", {
    data: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(response.status()).toBe(401);
  const challenge = response.headers()["www-authenticate"];
  const metadataUrl = challenge?.match(/^Bearer resource_metadata="([^"]+)"$/)?.[1];
  expect(metadataUrl).toBeTruthy();
  const metadata = new URL(metadataUrl!);
  expect(["127.0.0.1", "localhost"]).toContain(metadata.hostname);
  expect(metadata.port).toBe("3100");
  expect(metadata.pathname).toBe("/.well-known/oauth-protected-resource/api/mcp");
});

test("rejects cross-site OAuth consent decisions before touching auth state", async ({ request }) => {
  const response = await request.post("/api/oauth/decision", {
    form: { authorization_id: "untrusted", decision: "approve" },
    headers: { Origin: "https://attacker.example" },
  });
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toEqual({ error: "Cross-site authorization decisions are not allowed." });
});
