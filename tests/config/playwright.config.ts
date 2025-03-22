import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Configuration constants with environment variable fallbacks
const TEST_PORT = process.env.TEST_PORT || '3001';
const TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '120000', 10);
const TIMEOUT_NAVIGATION = parseInt(process.env.TIMEOUT_NAVIGATION || '60000', 10);
const TIMEOUT_ACTION = parseInt(process.env.TIMEOUT_ACTION || '30000', 10);
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '300000', 10);
const RUN_PARALLEL = process.env.CI ? false : false; // Enable parallelism in CI when ready
const RETRY_COUNT = process.env.CI ? 2 : 1;
const WORKERS = process.env.CI ? 1 : 1; // Default to sequential for stability, increase when ready

// Check if a base URL was specified, which means the server is already running
const skipWebServer = !!process.env.PLAYWRIGHT_TEST_BASE_URL;

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../e2e/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Playwright configuration for {{YOUR_PROJECT_NAME}}
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../e2e',
  /* Maximum time one test can run for */
  timeout: TIMEOUT_TEST,
  /* Run tests in files in sequence rather than parallel */
  fullyParallel: RUN_PARALLEL,
  /* Workers set to 1 to prevent parallel execution issues */
  workers: WORKERS,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: RETRY_COUNT,
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: TEST_BASE_URL,
    
    /* Collect trace for all tests to help with debugging */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    
    /* Record video for failed tests */
    video: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
    
    /* Set navigation timeout */
    navigationTimeout: TIMEOUT_NAVIGATION,
    
    /* Set action timeout */
    actionTimeout: TIMEOUT_ACTION,
    
    /* Configure viewport that works well for our tests */
    viewport: { width: 1280, height: 720 },
    
    /* Add useful test annotations */
    testIdAttribute: 'data-testid',
    
    /* Automatically capture accessibility snapshots */
    contextOptions: {
      reducedMotion: 'reduce',
      strictSelectors: false, // Less strict for better test stability
    },
  },

  /* Configure projects for major browsers */
  projects: [
    /* Default test project for development runs */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security'], // Allow cross-origin requests for testing
          slowMo: process.env.CI ? 0 : 0, // Slow down execution for debugging
        }
      },
    },
    
    /* Firefox test project - runs in CI or when specifically requested */
    {
      name: 'firefox',
      grep: /(CI|RUN_ALL_BROWSERS)/,
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    
    /* WebKit test project - runs in CI or when specifically requested */
    {
      name: 'webkit',
      grep: /(CI|RUN_ALL_BROWSERS)/,
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    
    /* Mobile Chrome test project - runs in CI or when specifically requested */
    {
      name: 'Mobile Chrome',
      grep: /(CI|RUN_MOBILE)/,
      use: { 
        ...devices['Pixel 5'],
      },
    },
    
    /* Mobile Safari test project - runs in CI or when specifically requested */
    {
      name: 'Mobile Safari',
      grep: /(CI|RUN_MOBILE)/,
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],
  
  /* Configure web server to start before tests if needed */
  webServer: skipWebServer ? undefined : {
    command: `npm run dev -- -p ${TEST_PORT}`,
    url: TEST_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: TIMEOUT_SERVER,
  },
}); 