// tests/a11y.spec.ts
//
// Precondition: same as e2e.spec.ts — the FastAPI backend must be started manually
// before running this suite (see e2e.spec.ts's header comment for the command).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  // Not testing the first-visit tour here — pre-seed it as "seen" so its
  // overlay doesn't intercept clicks meant for the page underneath.
  await page.addInitScript(() => localStorage.setItem("act-alike-tour-seen", "1"));
});

test.describe("Accessibility", () => {
  test("default state has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });

  // Manually verified 2026-07-17 against a live backend with ANTHROPIC_API_KEY set.
  test.skip("results state (after a flagship search) has no serious or critical axe violations", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });

  test("About modal open has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/");
    await page.locator(".help-btn").click();
    await page.waitForSelector('[data-testid="about-modal"]');
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });

  test("first-visit tour has no serious or critical axe violations", async ({ page }) => {
    // Overrides the file-wide seed above — this is specifically a regression
    // check for driver.js stamping invalid aria-expanded/aria-haspopup onto
    // non-widget elements (textbox/nav/div) it highlights; see tour.ts's
    // stripInvalidAria for the fix this guards.
    await page.addInitScript(() => localStorage.removeItem("act-alike-tour-seen"));
    await page.goto("/");
    await page.waitForSelector(".driver-popover");
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([]);
  });
});

test.describe("Mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  // Manually verified 2026-07-17 against a live backend with ANTHROPIC_API_KEY set.
  test.skip("no horizontal overflow at iPhone SE width, before or after a search", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.screenshot({ path: "test-results/mobile-default.png" });

    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    await page.screenshot({ path: "test-results/mobile-results.png" });

    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
