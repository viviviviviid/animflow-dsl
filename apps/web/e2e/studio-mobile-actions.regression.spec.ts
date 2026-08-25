import { expect, test } from "@playwright/test";

test("keeps the mobile authoring path in reach", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.locator(".v2-player").waitFor();

  await expect(page.getByRole("button", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Source", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Inspector", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cues", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Present", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
});
