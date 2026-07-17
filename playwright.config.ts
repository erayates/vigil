import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Scaffold-art baselines only. Regenerate once PROD-UI-001 / PROD-COMP-001 are
  // approved (see docs/development/coding-standards/testing.md).
  snapshotPathTemplate: 'tests/e2e/__screenshots__/scaffold/{projectName}/{arg}-{platform}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    // animations:'disabled' freezes CSS animation to a stable frame; tight
    // pixel budget catches layout/scaling regressions instead of hiding them.
    toHaveScreenshot: { maxDiffPixels: 100, animations: 'disabled', caret: 'hide' },
  },
  projects: [
    {
      name: 'desktop-1600',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
    },
    {
      name: 'compact-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
