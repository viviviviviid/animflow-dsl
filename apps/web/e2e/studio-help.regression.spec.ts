import { expect, test } from "@playwright/test";

test("opens workflow help from the canvas toolrail", async ({ page }) => {
  await page.goto("/");
  await page.locator(".v2-player").waitFor();
  await page.getByRole("button", { name: "Help" }).click();

  const dialog = page.getByRole("dialog", { name: "Build the lesson, then teach it" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Shape the diagram");
  await expect(dialog).toContainText("Direct each cue");
  await expect(dialog).toContainText("Teach or share");
  await dialog.getByRole("button", { name: "Back to canvas" }).click();
  await expect(dialog).toBeHidden();
});
