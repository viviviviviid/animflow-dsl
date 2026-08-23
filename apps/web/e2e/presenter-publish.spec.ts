import { expect, test } from "@playwright/test";

import { DEFAULT_V2_SOURCE } from "../data/v2-default";

test("opens the saved local lesson and navigates scenes from the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ready to teach")).toBeVisible();
  await expect(page.getByRole("button", { name: "Present", exact: true })).toBeEnabled();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const presenter = await popupPromise;
  await expect(presenter.getByRole("main")).toHaveClass(/presenter-shell/);
  await expect(presenter.getByRole("heading", { name: "Reveal the actors" })).toBeVisible();
  await presenter.keyboard.press("ArrowRight");
  await expect(presenter.getByRole("heading", { name: "Authorize payment" })).toBeVisible();
  await presenter.keyboard.press("Space");
  await expect(presenter.getByRole("button", { name: "Pause" })).toBeVisible();
  await presenter.keyboard.press("n");
  await expect(presenter.getByRole("complementary", { name: "Speaker notes" })).toBeHidden();
});

test("publishes an escaped immutable revision with CSP and deletion", async ({ page, request }) => {
  const title = `<img src=x onerror="globalThis.__animflowXss=1"> Security lesson`;
  const hostileSource = DEFAULT_V2_SOURCE.replace("Payment Gateway", `<img src=x onerror='globalThis.__animflowSvgXss=1'>`);
  const published = await request.post("/api/publish", {
    data: { source: hostileSource, title, documentId: `e2e-${test.info().project.name}` },
  });
  expect(published.status()).toBe(201);
  const receipt = await published.json() as { readonly url: string; readonly deletionToken: string; readonly integrityHash: string };
  expect(receipt.integrityHash).toMatch(/^[a-f0-9]{64}$/);

  const response = await page.goto(receipt.url);
  expect(response?.status()).toBe(200);
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("script-src 'unsafe-inline'");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  expect(await page.locator("img").count()).toBe(0);
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __animflowXss?: number }).__animflowXss)).toBeUndefined();
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __animflowSvgXss?: number }).__animflowSvgXss)).toBeUndefined();
  await expect(page.getByText("immutable public revision")).toBeVisible();

  const id = receipt.url.split("/").at(-1)!;
  expect((await request.delete(`/api/publish/${id}`, { headers: { Authorization: "Bearer wrong" } })).status()).toBe(403);
  expect((await request.delete(`/api/publish/${id}`, { headers: { Authorization: `Bearer ${receipt.deletionToken}` } })).status()).toBe(204);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Playback stopped" })).toBeVisible();
  await expect(page.getByText("Published revision was not found.")).toBeVisible();
});

test("rejects invalid and oversized public input without a partial revision", async ({ request }) => {
  const invalid = await request.post("/api/publish", { data: { source: "animflow 2 canvas {", documentId: "invalid" } });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).error.code).toBe("compile-failed");
  const oversized = await request.post("/api/publish", { data: { source: "x".repeat(256 * 1_024 + 1) } });
  expect(oversized.status()).toBe(413);
  expect((await oversized.json()).error.code).toBe("resource-limit");
});
