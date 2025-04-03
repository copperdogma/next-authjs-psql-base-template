import { PlaywrightTestConfig, defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

/**
 * Root-level Playwright configuration
 *
 * Follows best practices for Next.js and Firebase Auth E2E testing
 */

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Configuration constants with environment variable fallbacks
const PORT = process.env.TEST_PORT || '3335';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '60000', 10);
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '180000', 10);
const TEST_RETRIES = process.env.CI ? 2 : 1;

// Authentication state file path
export const STORAGE_STATE = path.join(__dirname, 'tests/.auth/user.json');

// Ensure the auth directory exists
const authDir = path.dirname(STORAGE_STATE);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}
if (!fs.existsSync(STORAGE_STATE)) {
  fs.writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [],
      origins: [],
    })
  );
}

const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e',
  timeout: TIMEOUT_TEST,
  expect: { timeout: 15000 }, // Reasonable expectation timeout
  fullyParallel: false, // Set to true when tests are fully isolated
  forbidOnly: !!process.env.CI,
  retries: TEST_RETRIES,
  workers: process.env.CI ? 1 : 1, // Increase when tests are stable
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    testIdAttribute: 'data-testid',
  },

  projects: [
    // Authentication setup project - runs first to set up auth state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // UI tests that don't require authentication
    {
      name: 'ui-tests',
      testMatch: /.*simple-test\.spec\.ts|.*navigation\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests in Chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      testIgnore: /.*simple-test\.spec\.ts|.*navigation\.spec\.ts/,
    },

    // Uncomment to add Firefox testing
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /navigation|accessibility|performance|basic\.spec\.ts/,
    // },
  ],

  // Built-in webServer configuration - manages Next.js server for tests
  webServer: {
    command: `cross-env NODE_ENV=test FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 FIRESTORE_EMULATOR_HOST=localhost:8080 next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: TIMEOUT_SERVER,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

export default config;
