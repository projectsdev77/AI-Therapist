import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // Every test gets a fresh browser context (and so fresh on-device storage).
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /desktop\.spec/ },
    // 720–1023px: the phone design widened, with the top bar's pill nav.
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 900, height: 800 } }, testIgnore: /desktop\.spec/ },
    // 1024px and up: the desktop app shell (sidebar, page, side panel).
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testMatch: /desktop\.spec/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
