import { expect, test } from "@playwright/test";

test("fits the mobile playback controls without hidden overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.locator(".v2-player").waitFor();

  await expect.poll(() => page.locator(".v2-controls").evaluate((controls) => controls.scrollWidth <= controls.clientWidth)).toBe(true);
});
