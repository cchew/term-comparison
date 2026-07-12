import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e.spec.ts", "a11y.spec.ts"],
  // Single worker: tests hit a live LLM-backed backend (/definitions calls the
  // real Anthropic API), and the results-state a11y/mobile tests were observed
  // timing out under default multi-worker concurrency (Tasks 16-17).
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
