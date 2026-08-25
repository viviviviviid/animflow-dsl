import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("authors, presents, publishes, and replays the 10-minute dogfood lecture", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ready to teach")).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles(resolve("examples/dogfood/ai-agent-runtime.animflow"));
  await expect(page.locator(".studio-scene-main").filter({ hasText: "10 — 신뢰성은 경계의 합이다" })).toBeVisible();
  await expect(page.locator(".studio-scene-card")).toHaveCount(10);
  await page.getByLabel("Lesson title").fill("AI Agent Runtime — 10 minute dogfood");

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const localPresenter = await popupPromise;
  await expect(localPresenter.locator(".presenter-transport > span")).toContainText("0:00 / 10:00");
  await localPresenter.keyboard.press("ArrowRight");
  await expect(localPresenter.getByRole("heading", { name: /02 — 입력은 계약이다/ })).toBeVisible();
  await localPresenter.keyboard.press("ArrowLeft");
  await expect(localPresenter.getByRole("heading", { name: /01 — Agent는 루프다/ })).toBeVisible();
  await localPresenter.close();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your lesson is public" })).toBeVisible();
  const publicUrl = await page.getByLabel("Public URL").inputValue();
  expect(publicUrl).toMatch(/\/p\/[a-f0-9]{32}$/);
  await page.goto(publicUrl);
  await expect(page.getByText("immutable public revision")).toBeVisible();
  if (process.env.ANIMFLOW_REALTIME_DOGFOOD === "1") {
    test.setTimeout(660_000);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.locator(".presenter-transport > span")).toContainText("10:00 / 10:00", { timeout: 620_000 });
  } else {
    await page.clock.install();
    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.fastForward(600_000);
    await expect(page.locator(".presenter-transport > span")).toContainText("10:00 / 10:00");
  }
  await page.keyboard.press("Home");
  await expect(page.locator(".presenter-transport > span")).toContainText("0:00 / 10:00");
});
