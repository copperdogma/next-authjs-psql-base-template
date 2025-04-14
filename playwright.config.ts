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
const PORT = process.env.TEST_PORT || '3777';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '60000', 10);
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '180000', 10);
const TEST_RETRIES = process.env.CI ? 2 : 1;

console.log('🔍 Playwright Configuration:');
console.log(`PORT: ${PORT}`);
console.log(`BASE_URL: ${BASE_URL}`);
console.log(`TIMEOUT_TEST: ${TIMEOUT_TEST}`);
console.log(`TIMEOUT_SERVER: ${TIMEOUT_SERVER}`);

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
  fullyParallel: true, // Set to true to enable parallel test execution
  forbidOnly: !!process.env.CI,
  retries: TEST_RETRIES,
  workers: process.env.CI ? 2 : undefined, // Limit workers on CI, use auto-detection locally
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',

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
      // Match basic navigation, simple tests, public access, specific non-auth flows
      testMatch: [
        /navigation-improved\.spec\.ts/,
        /simple\.spec\.ts/,
        /public-access\.spec\.ts/,
        /theme-toggle\.spec\.ts/,
        /accessibility-improved\.spec\.ts/, // Assuming this doesn't strictly need auth
        /basic\.spec\.ts/,
        /ultra-basic\.spec\.ts/,
      ],
      // Explicitly ignore tests known to require auth state
      testIgnore: [/auth\/.*\.spec\.ts/, /profile\/.*\.spec\.ts/, /dashboard\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests in Chromium
    {
      name: 'chromium',
      // Explicitly ignore the setup file itself and tests covered by 'ui-tests'
      testIgnore: [
        /.*\.setup\.ts/,
        /navigation-improved\.spec\.ts/,
        /simple\.spec\.ts/,
        /public-access\.spec\.ts/,
        /theme-toggle\.spec\.ts/,
        /accessibility-improved\.spec\.ts/,
        /basic\.spec\.ts/,
        /ultra-basic\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      // testIgnore: /.*simple-test\.spec\.ts|.*navigation\.spec\.ts/, // Remove old ignore
    },

    // API tests - no browser needed
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: {
        // No browser is needed for API tests
      },
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
    command: `npm run dev:test`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: TIMEOUT_SERVER,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

export default config;
