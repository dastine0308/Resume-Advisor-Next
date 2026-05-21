import { defineConfig, devices } from "@playwright/test";
import { loadTestEnv, getTestBaseUrl, hasE2eEnv } from "./tests/helpers/env";

loadTestEnv();

const baseURL = getTestBaseUrl();
const e2eEnabled = hasE2eEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: e2eEnabled ? "./tests/e2e/global-setup.ts" : undefined,
  globalTeardown: e2eEnabled ? "./tests/e2e/global-teardown.ts" : undefined,
  use: {
    baseURL,
    trace: "on-first-retry",
    storageState: e2eEnabled ? "tests/e2e/.auth/user.json" : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: e2eEnabled
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
