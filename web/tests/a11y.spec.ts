// tests/a11y.spec.ts
//
// Precondition: same as e2e.spec.ts — the FastAPI backend must be started manually
// before running this suite (see e2e.spec.ts's header comment for the command).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("default state has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });

  test("results state (after a flagship search) has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/");
    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 10000 });
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });
});
