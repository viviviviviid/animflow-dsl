import { expect, test } from "@playwright/test";

test("resizes, hides, restores, and persists each auxiliary Studio panel", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("animflow-studio-panel-layout-v1"));
  await page.reload();
  await page.locator(".v2-player").waitFor();

  const source = page.getByRole("region", { name: "AnimFlow source" });
  const sourceResizer = page.getByRole("separator", { name: "Resize source panel" });
  const sourceWidth = (await source.boundingBox())!.width;
  await sourceResizer.focus();
  await sourceResizer.press("ArrowRight");
  await sourceResizer.press("ArrowRight");
  await expect.poll(async () => (await source.boundingBox())!.width).toBeGreaterThan(sourceWidth + 20);

  const inspector = page.getByRole("complementary", { name: "Action inspector" });
  await page.getByRole("button", { name: "Hide inspector panel" }).click();
  await expect(inspector).toHaveCount(0);
  await page.getByRole("button", { name: "Show inspector" }).click();
  await expect(inspector).toBeVisible();

  const cueRail = page.getByRole("region", { name: "Scene cue rail" });
  const cueResizer = page.getByRole("separator", { name: "Resize scene cue rail" });
  const cueHeight = (await cueRail.boundingBox())!.height;
  await cueResizer.focus();
  await cueResizer.press("ArrowUp");
  await expect.poll(async () => (await cueRail.boundingBox())!.height).toBeGreaterThan(cueHeight + 10);
  await page.getByRole("button", { name: "Hide scene cue rail" }).click();
  await expect(cueRail).toHaveCount(0);
  await page.getByRole("button", { name: "Show scene cues" }).click();
  await expect(cueRail).toBeVisible();

  const saved = await page.evaluate(() => localStorage.getItem("animflow-studio-panel-layout-v1"));
  expect(saved).not.toBeNull();
  expect(JSON.parse(saved!).sizes.source).toBeGreaterThan(380);
  expect(JSON.parse(saved!).sizes.cues).toBeGreaterThan(186);

  const resizedSourceWidth = (await source.boundingBox())!.width;
  await page.reload();
  await page.locator(".v2-player").waitFor();
  await expect.poll(async () => (await page.getByRole("region", { name: "AnimFlow source" }).boundingBox())!.width)
    .toBeCloseTo(resizedSourceWidth, 0);
});

