import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, STORAGE_STATE } from './e2e/config';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],

  // Under `fullyParallel` the dev server serves several app boots at once and
  // a heavy route (analyze) can take well over the 5s default to render its
  // first paint. Waiting longer costs nothing on a passing assertion - only a
  // genuinely failing one takes longer to report.
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
});
