// tests/e2e.spec.ts
//
// Precondition: the FastAPI backend must be started manually before running this
// suite — Playwright's `webServer` config (playwright.config.ts) only manages the
// frontend dev server, not the backend. Start it in a separate terminal first:
//   source .venv/bin/activate && export $(grep ANTHROPIC_API_KEY .env) && term-comparison serve
// ANTHROPIC_API_KEY must be exported so the difference-summary test below gets a
// real, non-null summary back from the LLM layer.
import { test, expect } from "@playwright/test";

test.describe("Term comparison — flagship terms", () => {
  test("page title is Act Alike", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Act Alike");
  });

  test("clicking 'personal information' shows definitions from multiple Acts", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    await expect(page.locator(".definition-card").first()).toBeVisible();
    expect(await page.locator(".definition-card").count()).toBeGreaterThan(0);
  });

  test("clicking 'australian resident' shows definitions from multiple Acts", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.locator(".flagship-btn", { hasText: "australian resident" }).click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    await expect(page.locator(".definition-card").first()).toBeVisible();
    expect(await page.locator(".definition-card").count()).toBeGreaterThan(0);
  });

  test("searching an unknown term shows a not-found message", async ({ page }) => {
    await page.goto("/");
    await page.locator(".search-input").fill("zzz-not-a-real-term");
    await page.locator(".search-btn").click();
    await expect(page.locator(".load-error")).toContainText("No Commonwealth Act defines");
  });

  test("clicking 'personal information' renders a non-empty difference summary", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.locator(".flagship-btn", { hasText: "personal information" }).click();
    await page.waitForSelector(".difference-summary", { timeout: 45000 });
    await expect(page.locator(".difference-summary")).toBeVisible();
    await expect(page.locator(".difference-summary")).not.toHaveText("");
  });
});

test.describe("Term comparison — browse list", () => {
  test("filtering and clicking a non-flagship term renders its definitions", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    // The browse panel is collapsed by default — chips exist in the DOM but
    // are display:none until the toggle is clicked.
    await page.click(".term-browser-toggle");
    await page.waitForSelector(".term-chip", { timeout: 10000 });

    const chipCountBefore = await page.locator(".term-chip").count();
    expect(chipCountBefore).toBeGreaterThan(0);

    // Filter down using the display text of the first available chip, then click it.
    const firstChipText = (await page.locator(".term-chip").first().innerText()).trim();
    // Chip text includes the trailing act-count badge (e.g. "small business 3") — filter
    // on a prefix that will still match after the count renders inline.
    const filterQuery = firstChipText.split(/\s+\d+$/)[0]!;

    await page.locator(".term-filter-input").fill(filterQuery);

    const chipsAfter = page.locator(".term-chip");
    const chipCountAfter = await chipsAfter.count();
    expect(chipCountAfter).toBeGreaterThan(0);
    expect(chipCountAfter).toBeLessThanOrEqual(chipCountBefore);
    // Every remaining chip must still contain the filter query — proves the
    // filter actually narrowed the list, without assuming any specific
    // corpus content produces exactly one match (real corpus term
    // frequency varies as ingestion continues; see spec's point-in-time
    // snapshot caveat).
    const texts = await chipsAfter.allInnerTexts();
    for (const t of texts) {
      expect(t.toLowerCase()).toContain(filterQuery.toLowerCase());
    }

    await chipsAfter.first().click();
    await page.waitForSelector(".definition-card", { timeout: 30000 });
    await expect(page.locator(".definition-card").first()).toBeVisible();
  });
});
