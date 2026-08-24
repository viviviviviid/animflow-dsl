import { expect, test } from "@playwright/test";

// Regression: ISSUE-003 — the prebuilt report page omitted its runtime abuse contact
// Found by /qa on 2026-08-24
// Report: docs/acceptance/2026-08-24-vercel-supabase-readiness.md
test("shows the configured abuse contact", async ({ page }) => {
  await page.goto("/report");
  const contact = page.getByRole("link", { name: "Email the abuse contact" });
  await expect(contact).toBeVisible();
  await expect(contact).toHaveAttribute("href", /^mailto:[^?]+\?subject=AnimFlow%20content%20report$/);
  await expect(page.getByText("This deployment has not configured an abuse contact.")).toHaveCount(0);
});
