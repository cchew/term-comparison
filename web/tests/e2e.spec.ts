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
  test("page title is Term Comparison", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Term Comparison");
  });

  test("clicking 'personal information' shows definitions from 4 Acts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "personal information" }).click();
    await page.waitForSelector(".definition-card", { timeout: 10000 });
    await expect(page.locator(".definition-card")).toHaveCount(4);
  });

  test("clicking 'australian resident' shows definitions from 3 Acts", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "australian resident" }).click();
    await page.waitForSelector(".definition-card", { timeout: 10000 });
    await expect(page.locator(".definition-card")).toHaveCount(3);
  });

  test("searching an unknown term shows a not-found message", async ({ page }) => {
    await page.goto("/");
    await page.locator(".search-input").fill("zzz-not-a-real-term");
    await page.locator(".search-btn").click();
    await expect(page.locator(".load-error")).toContainText("No Commonwealth Act defines");
  });

  test("clicking 'personal information' renders a non-empty difference summary", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "personal information" }).click();
    await page.waitForSelector(".difference-summary", { timeout: 20000 });
    await expect(page.locator(".difference-summary")).toBeVisible();
    await expect(page.locator(".difference-summary")).not.toHaveText("");
  });
});
