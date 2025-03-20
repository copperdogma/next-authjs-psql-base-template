import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Check if a base URL was specified, which means the server is already running
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3001';
const skipWebServer = !!process.env.PLAYWRIGHT_TEST_BASE_URL;

/**
 * Playwright configuration for {{YOUR_PROJECT_NAME}}
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../e2e',
  /* Maximum time one test can run for */
  timeout: 60 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: baseUrl,
    /* Collect trace when retrying the failed test */
    trace: 'retain-on-failure',
    /* Record video only when retrying a test for the first time */
    video: 'retain-on-failure',
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
    /* Set navigation timeout */
    navigationTimeout: 30000,
    /* Set action timeout */
    actionTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Local development server setup - only used if PLAYWRIGHT_TEST_BASE_URL is not set */
  ...(skipWebServer ? {} : {
    webServer: {
      command: 'npm run dev',
      url: baseUrl,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 180000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3001',
      },
    }
  }),
}); 