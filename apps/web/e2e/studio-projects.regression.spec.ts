import { expect, test, type Page } from "@playwright/test";

import { STUDIO_EXAMPLES } from "../data/studio-examples";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("animflow-studio");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
  await page.locator(".v2-player").waitFor();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toBeEnabled();
  await expect.poll(() => countDocuments(page)).toBe(1);
});

test("creates independent projects from every bundled example", async ({ page }) => {
  for (const { title } of STUDIO_EXAMPLES) {
    await page.getByRole("button", { name: "Projects", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
    const example = dialog.locator(".studio-example-card").filter({ hasText: title });
    await expect(example).toBeVisible();
    await example.getByRole("button", { name: "Use example" }).click();

    await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue(title);
    await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
    await expect.poll(() => countDocuments(page)).toBeGreaterThanOrEqual(2);
  }

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  await expect(dialog.locator(".studio-project-card")).toHaveCount(STUDIO_EXAMPLES.length + 1);
  await expect(dialog).toContainText("Payment signal walkthrough");
  for (const { title } of STUDIO_EXAMPLES) await expect(dialog).toContainText(title);
});

test("switches, duplicates, and deletes local projects without mixing their source", async ({ page }) => {
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  await dialog.getByRole("button", { name: "＋ New project" }).click();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue("Untitled lesson");
  await expect(page.getByRole("button", { name: "Select node idea" })).toBeVisible();

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  const untitled = dialog.locator(".studio-project-card").filter({ hasText: "Untitled lesson" });
  await untitled.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue("Untitled lesson — copy");

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  const original = dialog.locator(".studio-project-card").filter({ hasText: "Payment signal walkthrough" });
  await original.locator(".studio-project-open").click();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue("Payment signal walkthrough");
  await expect(page.getByRole("button", { name: "Select node client" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select node idea" })).toHaveCount(0);

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  const copy = dialog.locator(".studio-project-card").filter({ hasText: "Untitled lesson — copy" });
  await copy.getByRole("button", { name: "Delete" }).click();
  await copy.getByRole("button", { name: "Confirm delete" }).click();
  await expect(dialog).not.toContainText("Untitled lesson — copy");
});

async function countDocuments(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => {
    const open = indexedDB.open("animflow-studio", 1);
    open.onerror = () => resolve(0);
    open.onsuccess = () => {
      const request = open.result.transaction("documents", "readonly").objectStore("documents").count();
      request.onerror = () => resolve(0);
      request.onsuccess = () => resolve(request.result);
    };
  }));
}
