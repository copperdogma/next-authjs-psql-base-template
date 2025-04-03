import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

/**
 * This configuration is specifically for running tests against a manually started server.
 * Use this when the auto-started server from the default config is stalling.
 *
 * Usage:
 * 1. First start the server manually: npm run dev -- -p 3336
 * 2. Then run tests: PLAYWRIGHT_TEST_BASE_URL=http://localhost:3336 npx playwright test --config=tests/config/playwright-manual.config.ts
 */
export default defineConfig({
  testDir: '../e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }]],

  use: {
    // Use the PLAYWRIGHT_TEST_BASE_URL environment variable to set the baseURL
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3336',
    trace: 'on',
    screenshot: 'on',
    video: 'on-first-retry',

    // More reliable navigation settings
    navigationTimeout: 20000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
