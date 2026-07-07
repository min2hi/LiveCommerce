import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * Tests run against: buyer-app (Next.js) and streamer-dashboard (Vite)
 *
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",

  // Run tests in parallel
  fullyParallel: true,

  // Fail CI if test.only() accidentally left in code
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI (flaky test protection)
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Test reporter
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],

  // Global test settings
  use: {
    // Base URL — override with E2E_BASE_URL env var in CI
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",

    // Always collect traces for failed tests
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure (useful for debugging CI failures)
    video: "retain-on-failure",

    // Timeout for each action (click, fill, etc.)
    actionTimeout: 10000,

    // Timeout for navigation
    navigationTimeout: 15000,
  },

  // ── Test Projects (Browser Targets) ─────────────────────────────────────
  projects: [
    // Buyer App tests (Next.js — port 3001)
    {
      name: "buyer-app-chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.BUYER_APP_URL || "http://localhost:3001",
      },
      testMatch: "**/buyer-app/**/*.e2e.ts",
    },
    {
      name: "buyer-app-mobile",
      use: {
        ...devices["Pixel 7"],
        baseURL: process.env.BUYER_APP_URL || "http://localhost:3001",
      },
      testMatch: "**/buyer-app/**/*.e2e.ts",
    },

    // Streamer Dashboard tests (Vite — port 5173)
    {
      name: "streamer-dashboard-chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.STREAMER_DASHBOARD_URL || "http://localhost:5173",
      },
      testMatch: "**/streamer-dashboard/**/*.e2e.ts",
    },

    // Admin Panel tests (Vite — port 5174)
    {
      name: "admin-panel-chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.ADMIN_PANEL_URL || "http://localhost:5174",
      },
      testMatch: "**/admin-panel/**/*.e2e.ts",
    },
  ],

  // ── Start Dev Servers Before Tests ──────────────────────────────────────
  // Uncomment when frontend apps are implemented
  // webServer: [
  //   {
  //     command: 'npm run dev --workspace=backend',
  //     port: 3000,
  //     reuseExistingServer: !process.env.CI,
  //   },
  //   {
  //     command: 'npm run dev --workspace=frontend/buyer-app',
  //     port: 3001,
  //     reuseExistingServer: !process.env.CI,
  //   },
  // ],
});
