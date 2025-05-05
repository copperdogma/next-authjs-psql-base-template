import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Define baseURL based on environment variables with fallback
const PORT = process.env.TEST_PORT || '3777'; // Use TEST_PORT from .env.test or default
const baseURL = `http://localhost:${PORT}`;
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '60000', 10); // 60 seconds

// Use process.env.STORAGE_STATE to point to the auth file.
const STORAGE_STATE = path.join(__dirname, '../e2e/auth.setup.json');

console.log('🔍 Playwright Configuration:');
console.log(`PORT: ${PORT}`);
console.log(`BASE_URL: ${baseURL}`);
console.log(`TIMEOUT_TEST: ${process.env.TIMEOUT_TEST || 'default (30000ms)'}`);
console.log(`TIMEOUT_SERVER: ${TIMEOUT_SERVER}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // testDir: path.join(__dirname, '../tests/e2e'),
  testDir: path.join(__dirname, '../tests'), // Run tests from root tests dir
  // Glob patterns or regular expressions that match test files.
  testMatch: '**/*.@(spec|test).?(c|m)[jt]s?(x)',
  // Directory holding playwright report files.
  outputDir: '../test-results',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Limit the number of failures on CI to save resources
  maxFailures: process.env.CI ? 10 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? 'html' : 'list',

  // Global setup script, runs once before all tests
  // globalSetup: require.resolve('./global-setup'),
  // globalTeardown: require.resolve('./global-teardown'),

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: baseURL,
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    // Capture screenshot after each test failure.
    screenshot: 'only-on-failure',
    // Record video only when retrying a test for the first time.
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      teardown: 'cleanup auth state',
    },
    {
      name: 'cleanup auth state',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use prepared auth state.
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    // Test against mobile viewports.
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    // Test against different browsers if needed
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['setup'],
    // },
    // Tests specifically for API routes, don't need browser setup or auth state
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL: baseURL }, // Ensure API tests use the correct base URL
    },
    // Tests that do not require authentication
    {
      name: 'ui-tests',
      testMatch: [/basic\.spec\.ts/, /simple-test\.spec\.ts/, /basic-navigation\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'next dev --port 3777',
    port: 3777,
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_ENDPOINTS: 'true',
      NEXT_PUBLIC_IS_E2E_TEST_ENV: 'true',
    },
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
