import { expect, test } from "@playwright/test";
import { exportSource } from "./helpers/source";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
});

test("isolates SVG definitions, clears background selection, and follows node drags", async ({ page }) => {
  const time = page.getByRole("slider", { name: "Animation time" });
  await time.fill((await time.getAttribute("max"))!);
  const canvas = page.locator(".v2-canvas-surface svg");
  const ids = await page.locator("svg defs [id]").evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
  const node = canvas.getByRole("button", { name: "Select node client", exact: true });
  await node.click();
  await expect(node).toHaveAttribute("data-animflow-selected", "true");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await canvas.click({ position: { x: 8, y: 80 } });
  await expect(node).toHaveAttribute("data-animflow-selected", "false");

  const edge = canvas.locator('[data-animflow-id="authorize"] [data-animflow-edge-line]');
  const original = await edge.getAttribute("d");
  const rect = (await node.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 30, rect.y + rect.height / 2 + 48, { steps: 5 });
  await expect(node).toHaveAttribute("data-animflow-dragging", "true");
  await expect(edge).not.toHaveAttribute("d", original!);
  await page.mouse.up();
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
});

test("keeps keyboard focus inside a modal and restores the invoking control", async ({ page }) => {
  const help = page.getByRole("button", { name: "Help", exact: true });
  await help.click();
  const close = page.getByRole("button", { name: "Close help dialog" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Back to canvas" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(help).toBeFocused();
});

test("zooms the preview independently and keeps light controls readable", async ({ page }) => {
  const canvas = page.locator(".v2-canvas-surface svg");
  const initial = await canvas.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(canvas).not.toHaveAttribute("viewBox", initial!);
  await page.getByRole("button", { name: "Fit canvas", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", initial!);
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + 10, bounds.y + 60);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 40, bounds.y + 100, { steps: 4 });
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute("viewBox", initial!);
  await page.getByRole("button", { name: "Fit canvas", exact: true }).click();
  await expect(canvas).toHaveAttribute("viewBox", initial!);
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.getByRole("group", { name: "Animation playback" })).toHaveCSS("background-color", "rgb(244, 247, 251)");
  await expect(page.getByRole("group", { name: "Animation playback" })).toHaveCSS("color", "rgb(23, 32, 51)");
});

test("gives mobile users a canvas, editable title, and distinct workspace panels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const panels = page.getByRole("navigation", { name: "Workspace panels" });
  const source = page.getByRole("region", { name: "AnimFlow source" });
  const stage = page.getByRole("region", { name: "Lecture canvas" });
  await expect(stage).toBeVisible();
  await expect(source).toBeHidden();
  await page.getByRole("textbox", { name: "Lesson title" }).fill("Mobile lesson");
  await panels.getByRole("button", { name: "Source", exact: true }).click();
  await expect(source).toBeVisible();
  await expect(stage).toBeHidden();
  await panels.getByRole("button", { name: "Inspector", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Action inspector" })).toBeVisible();
  await expect(source).toBeHidden();
  await panels.getByRole("button", { name: "Canvas", exact: true }).click();
  await expect(stage).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const canvasBounds = (await stage.boundingBox())!;
  expect(canvasBounds.y + canvasBounds.height).toBeLessThanOrEqual(844);
});

test("formats through the worker and restores exact source with Undo", async ({ page }) => {
  const original = 'animflow 2.2\ncanvas {size 1200 by 800 theme light background surface}\ngraph pipeline {layout flow right {} node api "API" {}}\nstory main {initial {show api} scene overview "Overview" duration 1s {say "Hello"}}\n';
  await page.locator('input[type="file"]').setInputFiles({ name: "format-test.animflow", mimeType: "text/plain", buffer: Buffer.from(original) });
  await expect(page.getByRole("button", { name: "Select node api", exact: true })).toBeVisible();
  await page.getByRole("slider", { name: "Animation time" }).fill("500");
  await page.getByRole("combobox", { name: "Playback speed" }).selectOption("2");
  await page.getByRole("checkbox", { name: "Loop" }).check();
  await expect(page.getByRole("button", { name: "Format source" })).toBeEnabled();
  await page.getByRole("button", { name: "Format source" }).click();
  await expect(page.getByRole("status")).toContainText("Source formatted");
  await expect(page.getByRole("slider", { name: "Animation time" })).toHaveValue("500");
  await expect(page.getByRole("combobox", { name: "Playback speed" })).toHaveValue("2");
  await expect(page.getByRole("checkbox", { name: "Loop" })).toBeChecked();
  expect(await exportSource(page)).not.toBe(original);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
  expect(await exportSource(page)).toBe(original);
});
