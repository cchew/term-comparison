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

test.describe("Mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("no horizontal overflow at iPhone SE width, before or after a search", async ({ page }) => {
    await page.goto("/");
    await page.screenshot({ path: "test-results/mobile-default.png" });

    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 10000 });
    await page.screenshot({ path: "test-results/mobile-results.png" });

    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
