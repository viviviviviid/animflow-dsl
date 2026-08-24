import { expect, test, type Page } from "@playwright/test";

import { STUDIO_EXAMPLES } from "../data/studio-examples";
import { DEFAULT_V2_SOURCE } from "../data/v2-default";

test.beforeEach(async ({ page }) => {
  await resetStudio(page);
});

test("curates one starter followed by feature-complete branching showcases", () => {
  expect(STUDIO_EXAMPLES[0]?.title).toBe("Flowchart starter");
  expect(STUDIO_EXAMPLES.map(({ title }) => title)).not.toContain("OAuth 2.1 with PKCE");

  for (const example of STUDIO_EXAMPLES.slice(1)) {
    const edges = [...example.source.matchAll(/^  edge \w+: (\w+)\.\w+ -> (\w+)\.\w+ \{/gm)];
    const outgoing = new Map<string, number>();
    const incoming = new Map<string, number>();
    for (const [, from, to] of edges) {
      outgoing.set(from!, (outgoing.get(from!) ?? 0) + 1);
      incoming.set(to!, (incoming.get(to!) ?? 0) + 1);
    }
    const branches = [...outgoing.values()].some((count) => count > 1);
    const merges = [...incoming.values()].some((count) => count > 1);
    const sceneCount = example.source.match(/^  scene /gm)?.length ?? 0;
    const subtitleCount = example.source.match(/^    say /gm)?.length ?? 0;
    const cameraMoves = example.source.match(/^    action \w+: camera /gm)?.length ?? 0;

    expect(branches || merges, example.title).toBe(true);
    expect(subtitleCount, example.title).toBe(sceneCount);
    expect(cameraMoves, example.title).toBeGreaterThanOrEqual(2);
    expect(example.source, example.title).toMatch(/draw \w+ via trace/);
    expect(example.source, example.title).toMatch(/highlight \w+ tone/);
  }
});

test("adds an action, reorders its cue, and previews it with one undo history", async ({ page }) => {
  const errors = capturePageErrors(page);
  await openStudio(page);

  await page.getByRole("button", { name: "Select node client" }).click();
  await expect(page.getByRole("complementary", { name: "Action inspector" })).toContainText("Client");
  await page.getByRole("button", { name: "◎ Focus" }).click();

  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Saved tx-");
  await page.getByRole("button", { name: /02 Authorize payment thumbnail/ }).click();
  await page.getByRole("button", { name: "Select node client" }).click();
  await page.getByRole("button", { name: "⌗ Camera" }).click();
  await expect(page.getByRole("status")).toContainText("Saved tx-2");
  await expect(page.locator(".studio-stage-head strong")).toHaveText("Authorize payment");
  await page.getByRole("button", { name: "Move Reveal the actors later" }).click();
  await expect(page.locator(".studio-scene-copy strong").first()).toHaveText("Authorize payment");
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(page.getByRole("button", { name: "Pause animation" })).toBeVisible();
  await expect.poll(() => errors).toEqual([]);
});

test("persists a node drag as one v2.2 source transaction and can auto-arrange it", async ({ page }) => {
  const errors = capturePageErrors(page);
  await openStudio(page);
  const node = page.locator('[data-animflow-id="client"]').first();
  const bounds = await node.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 90, { steps: 6 });
  await page.mouse.up();

  await expect.poll(async () => page.evaluate(readSavedSource)).toContain("position x");
  await expect.poll(async () => page.evaluate(readSavedSource)).toMatch(/\n\s+pin\n/);
  await expect(page.getByRole("status")).toContainText("Pinned client");

  await page.getByRole("button", { name: "Auto-arrange" }).click();
  await expect.poll(async () => page.evaluate(readSavedSource)).not.toContain("position x");
  await expect(page.getByRole("status")).toContainText("Auto-arranged");
  await expect.poll(() => errors).toEqual([]);
});

test("recovers the latest atomic local revision after reload", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("textbox", { name: "Lesson title" }).fill("Recovered systems lesson");
  await page.getByRole("textbox", { name: "What should the audience understand in this cue?" }).fill("Retries are visible and deterministic.");
  await page.getByRole("button", { name: "Set narration" }).click();
  await expect(page.getByRole("status")).toContainText("Saved tx-");
  await expect.poll(async () => page.evaluate(readSavedSource)).toContain("Retries are visible and deterministic.");

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toHaveValue("Recovered systems lesson");
  await expect(page.getByRole("status")).toContainText("Recovered revision");
});

test("keeps the last valid preview while an invalid draft is repaired", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("button", { name: "Select node client" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.animflow",
    mimeType: "text/plain",
    buffer: Buffer.from("animflow 2.1\nthis is not valid"),
  });

  await expect(page.getByText("Stale preview", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "↗ Reveal" })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Animation time" })).toBeEnabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: "repaired.animflow",
    mimeType: "text/plain",
    buffer: Buffer.from(DEFAULT_V2_SOURCE),
  });
  await expect(page.getByText("Ready to teach", { exact: true })).toBeVisible();
  await expect(page.getByText("Stale preview", { exact: true })).toHaveCount(0);
});

test("imports a strict Mermaid flowchart into editable native source", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("button", { name: "Import Mermaid" }).click();
  await page.getByRole("textbox", { name: "Mermaid source" }).fill("flowchart LR\n  Client --> API\n  API --> Database");
  await page.getByRole("button", { name: "Import flowchart" }).click();

  await expect(page.getByRole("status")).toContainText("Mermaid flowchart imported");
  await expect(page.getByRole("button", { name: /Select node .*client/i })).toBeVisible();
  await expect.poll(async () => page.evaluate(readSavedSource)).toContain("animflow 2.1");
});

test("prevents two tabs from overwriting one local lesson", async ({ page, context }) => {
  await openStudio(page);
  const second = await context.newPage();
  await second.goto("/");

  const conflict = second.getByRole("alert").filter({ hasText: "Another tab is editing" });
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Save as copy" }).click();
  await expect(conflict).toHaveCount(0);
  await expect(second.getByRole("textbox", { name: "Lesson title" })).toHaveValue(/— copy$/);
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toBeEnabled();
});

test("surfaces storage quota failures with an export fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite") throw new DOMException("Test quota", "QuotaExceededError");
      return transaction.call(this, args[0] as string | string[], args[1], args[2]);
    };
  });
  await page.goto("/");

  const alert = page.getByRole("alert").filter({ hasText: "Browser storage is full" });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("button", { name: "Export source" })).toBeVisible();
});

test("loads the source editor entirely from the local application", async ({ page }) => {
  const externalRequests: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") await route.continue();
    else {
      externalRequests.push(url.href);
      await route.abort();
    }
  });
  await openStudio(page);

  await expect(page.getByRole("region", { name: "AnimFlow source" })).toBeVisible();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test("opens the current project source first and lets authors hide it", async ({ page }) => {
  await openStudio(page);
  const source = page.getByRole("region", { name: "AnimFlow source" });

  await expect(source).toBeVisible();
  await expect(source).toContainText("payment-signal-walkthrough.animflow");
  await page.getByRole("button", { name: "Hide source panel" }).click();
  await expect(source).toHaveCount(0);
  await page.getByRole("button", { name: "Show source" }).click();
  await expect(source).toBeVisible();
  await expect(page.locator(".monaco-editor")).toBeVisible();
});

test("persists light mode and keeps labeled arrows legible", async ({ page }) => {
  await openStudio(page);
  const shell = page.locator(".studio-shell");

  await expect(shell).toHaveAttribute("data-studio-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(shell).toHaveAttribute("data-studio-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("animflow-studio-theme"))).toBe("light");

  const edge = page.locator('[data-animflow-edge-line="true"]').first();
  await expect(edge).toHaveAttribute("stroke-width", "3.25");
  const label = page.locator('[data-animflow-edge-label="true"]').first();
  await expect(label).toHaveAttribute("paint-order", "stroke");
  await expect(label.locator("rect")).toHaveCount(0);
  await expect(page.locator('marker[markerUnits="strokeWidth"]').first()).toHaveAttribute("markerWidth", "4.25");

  await page.reload();
  await expect(shell).toHaveAttribute("data-studio-theme", "light");
  await expect(page.locator(".monaco-editor.vs")).toBeVisible();
});

test("fits the authoring controls without horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(".v2-player").waitFor();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
}

async function openStudio(page: Page): Promise<void> {
  if (page.url() === "about:blank") await page.goto("/");
  await page.locator(".v2-player").waitFor();
  await expect(page.getByRole("textbox", { name: "Lesson title" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Select node client" })).toBeVisible();
}

function capturePageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

function readSavedSource(): Promise<string> {
  return new Promise((resolve) => {
    const open = indexedDB.open("animflow-studio", 1);
    open.onerror = () => resolve("");
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction(["documents", "revisions"], "readonly");
      const documentRequest = transaction.objectStore("documents").get("local-lesson");
      documentRequest.onerror = () => resolve("");
      documentRequest.onsuccess = () => {
        const metadata = documentRequest.result as { currentRevision?: number } | undefined;
        if (metadata?.currentRevision === undefined) return resolve("");
        const revisionRequest = transaction.objectStore("revisions").get(["local-lesson", metadata.currentRevision]);
        revisionRequest.onerror = () => resolve("");
        revisionRequest.onsuccess = () => resolve(String(revisionRequest.result?.source ?? ""));
      };
    };
  });
}
