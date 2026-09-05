import { expect, test } from "@playwright/test";

test("renders stable pencil strokes with self-hosted handwriting and exact connected endpoints", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
  const canvas = page.locator('.v2-canvas-surface svg[role="img"]');
  await expect(canvas).toHaveAttribute("data-animflow-appearance", "sketch");
  const fonts = await page.evaluate(async () => {
    const latin = await document.fonts.load('20px "Excalifont"', 'Request');
    const korean = await document.fonts.load('20px "Gaegu"', '요청 처리');
    return { latin: latin.map((face) => face.status), korean: korean.map((face) => face.status) };
  });
  expect(fonts.latin).toEqual(["loaded"]);
  expect(fonts.korean).toEqual(["loaded"]);

  const strokes = canvas.locator("[data-animflow-sketch]");
  const original = await strokes.evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
  expect(original.length).toBeGreaterThan(4);
  const time = page.getByRole("slider", { name: "Animation time" });
  await time.fill((await time.getAttribute("max"))!);
  expect(await strokes.evaluateAll((paths) => paths.map((path) => path.getAttribute("d")))).toEqual(original);

  const gaps = await canvas.locator('[data-animflow-layer="edges"] > g').evaluateAll((edges) => edges.map((edge) => {
    const ink = edge.querySelector<SVGPathElement>("[data-animflow-edge-line]")!;
    const route = edge.querySelector<SVGPathElement>("[data-animflow-edge-hit]")!;
    const start = ink.getPointAtLength(0);
    const expectedStart = route.getPointAtLength(0);
    const end = ink.getPointAtLength(ink.getTotalLength());
    const expectedEnd = route.getPointAtLength(route.getTotalLength());
    return Math.max(Math.hypot(start.x - expectedStart.x, start.y - expectedStart.y), Math.hypot(end.x - expectedEnd.x, end.y - expectedEnd.y));
  }));
  for (const gap of gaps) expect(gap).toBeLessThan(0.05);
  await expect(canvas.locator("marker path").first()).toHaveAttribute("fill", "none");
});
