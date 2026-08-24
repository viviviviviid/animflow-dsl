import { expect, test, type Page } from "@playwright/test";

import { STUDIO_EXAMPLES } from "../data/studio-examples";

interface VisualIssue {
  readonly example: string;
  readonly scene: string;
  readonly theme: "dark" | "light";
  readonly kind: "node-overlap" | "overlay-overlap" | "label-overlap" | "text-clipped" | "element-clipped";
  readonly first: string;
  readonly second: string;
  readonly area: number;
}

test("keeps every bundled lesson readable across scenes and themes", async ({ page }) => {
  test.slow();
  await resetStudio(page);
  await page.setViewportSize({ width: 1440, height: 1000 });

  const issues: VisualIssue[] = [];
  for (const example of STUDIO_EXAMPLES) {
    await openExample(page, example.title);
    const expectedScenes = [...example.source.matchAll(/^  scene \w+ "([^"]+)"/gm)].map((match) => match[1]!);
    const sceneCards = page.locator(".studio-scene-card");
    await expect(sceneCards).toHaveCount(expectedScenes.length);
    await expect(sceneCards.first()).toContainText(expectedScenes[0]!);

    for (const theme of ["dark", "light"] as const) {
      await setTheme(page, theme);
      for (let index = 0; index < expectedScenes.length; index += 1) {
        const card = sceneCards.nth(index);
        const scene = expectedScenes[index]!;
        await card.click();
        await expect(page.locator(".studio-stage-head strong")).toHaveText(scene);
        issues.push(...await collectVisualIssues(page, example.title, scene, theme));
        if (
          process.env.ANIMFLOW_QA_SCREENSHOTS === "1" &&
          example.title === "Database query planner" &&
          scene === "Execute the chosen operators"
        ) {
          await page.screenshot({
            path: `.gstack/qa-reports/screenshots/database-planner-fixed-${theme}.png`,
            fullPage: true,
          });
        }
      }
    }
  }

  await test.info().attach("visual-integrity.json", {
    body: Buffer.from(JSON.stringify(issues, null, 2)),
    contentType: "application/json",
  });
  expect(issues).toEqual([]);
});

async function resetStudio(page: Page): Promise<void> {
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
}

async function openExample(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose the lesson to direct" });
  const example = dialog.locator(".studio-example-card").filter({ hasText: title });
  await example.getByRole("button", { name: "Use example" }).click();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue(title);
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
}

async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  const shell = page.locator(".studio-shell");
  if (await shell.getAttribute("data-studio-theme") === theme) return;
  await page.getByRole("button", { name: `Switch to ${theme} mode` }).click();
  await expect(shell).toHaveAttribute("data-studio-theme", theme);
}

async function collectVisualIssues(
  page: Page,
  example: string,
  scene: string,
  theme: "dark" | "light",
): Promise<VisualIssue[]> {
  return page.locator('.v2-canvas-surface svg[role="img"]').evaluate((svg, context) => {
    const threshold = 12;
    const root = svg.getBoundingClientRect();
    const box = (element: Element) => element.getBoundingClientRect();
    const area = (rect: DOMRect) => Math.max(0, rect.width) * Math.max(0, rect.height);
    const overlap = (left: DOMRect, right: DOMRect) =>
      Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
      * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
    const mostlyInCanvas = (rect: DOMRect) => area(rect) > 0 && overlap(rect, root) / area(rect) >= 0.85;
    const canvasFraction = (rect: DOMRect) => area(rect) > 0 ? overlap(rect, root) / area(rect) : 0;
    const effectiveOpacity = (element: Element) => {
      let opacity = 1;
      let current: Element | null = element;
      while (current && current !== svg) {
        opacity *= Number(getComputedStyle(current).opacity || "1");
        current = current.parentElement;
      }
      return opacity;
    };
    const visible = (element: Element) => {
      const rect = box(element);
      const style = getComputedStyle(element);
      return effectiveOpacity(element) > 0.08 && style.visibility !== "hidden" && mostlyInCanvas(rect);
    };
    const id = (element: Element) => element.getAttribute("data-animflow-id") ?? "unknown";
    const nodes = [...svg.querySelectorAll('[data-animflow-layer="nodes"] > g[data-animflow-id]')]
      .map((element) => ({ element, visual: element.querySelector(":scope > path:not([fill='none'])") }))
      .filter((item): item is { element: Element; visual: Element } => item.visual !== null && visible(item.element));
    const overlays = [...svg.querySelectorAll('[data-animflow-layer="overlays"] > g[data-animflow-id]')]
      .map((element) => ({ element, visual: element.querySelector("rect:not([fill='none'])") }))
      .filter((item): item is { element: Element; visual: Element } => item.visual !== null && visible(item.element));
    const labels = [...svg.querySelectorAll('[data-animflow-edge-label="true"]')].filter(visible);
    const found: VisualIssue[] = [];
    const push = (kind: VisualIssue["kind"], first: string, second: string, intersection: number) => {
      if (intersection <= threshold) return;
      found.push({ ...context, kind, first, second, area: Math.round(intersection) });
    };

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        push("node-overlap", id(nodes[left]!.element), id(nodes[right]!.element), overlap(box(nodes[left]!.visual), box(nodes[right]!.visual)));
      }
    }
    for (const overlay of overlays) {
      for (const node of nodes) push("overlay-overlap", id(overlay.element), id(node.element), overlap(box(overlay.visual), box(node.visual)));
    }
    for (const label of labels) {
      const edge = label.closest("g[data-animflow-id]");
      for (const node of nodes) push("label-overlap", id(edge ?? label), id(node.element), overlap(box(label), box(node.visual)));
    }
    for (const node of nodes) {
      const text = node.element.querySelector("text");
      const outline = node.visual;
      if (!text || !outline) continue;
      const textBox = box(text);
      const outlineBox = box(outline);
      const outside = area(textBox) - overlap(textBox, outlineBox);
      push("text-clipped", id(node.element), "outline", outside);
    }
    const clippingCandidates = [
      ...nodes.map((node) => ({ id: id(node.element), element: node.visual })),
      ...[...svg.querySelectorAll('[data-animflow-layer="overlays"] > g[data-animflow-id]')]
        .map((element) => ({ id: id(element), element: element.querySelector("rect:not([fill='none'])") }))
        .filter((item): item is { id: string; element: Element } => item.element !== null),
      ...[...svg.querySelectorAll('[data-animflow-edge-label="true"]')].map((element) => ({
        id: id(element.closest("g[data-animflow-id]") ?? element),
        element,
      })),
    ];
    for (const candidate of clippingCandidates) {
      if (effectiveOpacity(candidate.element) <= 0.08) continue;
      const fraction = canvasFraction(box(candidate.element));
      if (fraction > 0.02 && fraction < 0.98) {
        found.push({ ...context, kind: "element-clipped", first: candidate.id, second: "canvas", area: Math.round(fraction * 100) });
      }
    }
    return found;
  }, { example, scene, theme });
}
