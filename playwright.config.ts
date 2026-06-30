import { defineConfig, devices } from "@playwright/test";

const command = (app: string) => `corepack pnpm --filter @datastorified/${app} ${process.env.CI ? "start" : "dev"}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: .05 } },
  use: {
    ...devices["Desktop Chrome"],
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: command("website"), url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: command("calculators"), url: "http://127.0.0.1:3001", reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: command("tools"), url: "http://127.0.0.1:3002", reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});
