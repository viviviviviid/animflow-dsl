import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

/** Read the public export, independent of Monaco's virtualized visible lines. */
export async function exportSource(page: Page): Promise<string> {
  const menu = page.locator(".studio-overflow-menu");
  if (await menu.getAttribute("open") === null) await menu.locator("summary").click();
  const pending = page.waitForEvent("download");
  await menu.getByRole("button", { name: "Export source", exact: true }).click();
  const download = await pending;
  const source = await readFile((await download.path())!, "utf8");
  await menu.locator("summary").click();
  return source;
}
