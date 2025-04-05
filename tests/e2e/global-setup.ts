import { request } from '@playwright/test';
import axios from 'axios';

/**
 * Configuration for test environment
 */
interface TestConfig {
  baseUrl: string;
  port: string;
  healthURL: string;
  projectId: string;
  authEmulatorUrl: string;
  firestoreEmulatorUrl: string;
  firestoreClearUrl: string;
  authClearUrl: string;
}

/**
 * Initialize test configuration from environment variables
 */
function initTestConfig(): TestConfig {
  // Get environment configuration
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
  const port = process.env.TEST_PORT || '3777';
  const healthURL = `${baseUrl}/api/health`;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template';

  // Emulator URLs and endpoints
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';
  const firestoreClearUrl = `${firestoreEmulatorUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const authClearUrl = `${authEmulatorUrl}/emulator/v1/projects/${projectId}/accounts`;

  return {
    baseUrl,
    port,
    healthURL,
    projectId,
    authEmulatorUrl,
    firestoreEmulatorUrl,
    firestoreClearUrl,
    authClearUrl,
  };
}

/**
 * Display test environment information
 */
function logEnvironment(config: TestConfig): void {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│            🔍 E2E TEST ENVIRONMENT              │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Base URL:      ${config.baseUrl.padEnd(35)} │`);
  console.log(`│ Port:          ${config.port.padEnd(35)} │`);
  console.log(`│ Health Check:  ${config.healthURL.padEnd(35)} │`);
  console.log(`│ Auth Emulator: ${config.authEmulatorUrl.padEnd(35)} │`);
  console.log(`│ NODE_ENV:      ${(process.env.NODE_ENV || 'not set').padEnd(35)} │`);
  console.log('└─────────────────────────────────────────────────┘');
}

/**
 * Clear Firestore emulator data
 */
async function clearFirestoreData(url: string): Promise<void> {
  console.log(`Clearing Firestore data at ${url}...`);
  try {
    const response = await axios.delete(url);
    console.log(`✅ Firestore data cleared. Status: ${response.status}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to clear Firestore data: ${errorMessage}`);
    console.warn('This is not critical if you are not using Firestore in your tests');
  }
}

/**
 * Clear Auth emulator data
 */
async function clearAuthData(url: string): Promise<void> {
  console.log(`Clearing Auth data at ${url}...`);
  try {
    const response = await axios.delete(url);
    console.log(`✅ Auth data cleared. Status: ${response.status}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to clear Auth data: ${errorMessage}`);
    console.warn('This may cause tests to fail if they depend on specific auth states');
  }
}

/**
 * Clear all Firebase emulator data
 */
async function clearEmulatorData(config: TestConfig): Promise<void> {
  console.log('🧹 Clearing Firebase emulator data...');
  try {
    await clearFirestoreData(config.firestoreClearUrl);
    await clearAuthData(config.authClearUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Error clearing emulator data: ${errorMessage}`);
    // Non-fatal error - continue with the tests
  }
}

/**
 * Perform a single health check attempt
 */
async function attemptHealthCheck(
  context: any,
  url: string,
  attempt: number,
  maxAttempts: number
): Promise<boolean> {
  try {
    const response = await context.get(url, {
      timeout: 10000, // 10 seconds timeout per attempt
    });

    // Check if the response is OK (status 200-299)
    if (!response.ok()) {
      console.log(
        `❌ Health check attempt ${attempt}/${maxAttempts} failed with status ${response.status()}`
      );
      return false;
    }

    // Parse response body as JSON
    const body = await response.json();

    // Validate health check response
    if (body.status !== 'ok') {
      console.log(
        `❌ Health check attempt ${attempt}/${maxAttempts} returned non-ok status: ${JSON.stringify(body)}`
      );
      return false;
    }

    // Health check successful
    console.log('✅ Application health check passed! Server is ready for testing.');
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ Health check attempt ${attempt}/${maxAttempts} failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Verify application health with retries
 */
async function verifyAppHealth(context: any, config: TestConfig): Promise<boolean> {
  console.log(`🔄 Checking application health endpoint at ${config.healthURL}...`);
  let healthCheckSuccess = false;
  let attempts = 0;
  const maxAttempts = 5;
  const retryDelay = 5000; // 5 seconds between retries

  while (!healthCheckSuccess && attempts < maxAttempts) {
    attempts++;

    healthCheckSuccess = await attemptHealthCheck(context, config.healthURL, attempts, maxAttempts);

    if (!healthCheckSuccess && attempts < maxAttempts) {
      // Wait before retrying
      console.log(`⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  if (!healthCheckSuccess) {
    throw new Error(`Health check failed after ${maxAttempts} attempts`);
  }

  return true;
}

/**
 * Global setup for E2E tests
 * Runs before all tests to ensure the application is ready
 * Also handles clearing Firebase emulator data for clean test runs
 */
async function globalSetup() {
  // Initialize configuration
  const config = initTestConfig();

  // Display environment info
  logEnvironment(config);

  // Create a new request context with appropriate timeout
  const context = await request.newContext({
    timeout: 30000, // 30 seconds timeout for requests
  });

  try {
    // Clear Firebase emulator data
    await clearEmulatorData(config);

    // Verify application health
    await verifyAppHealth(context, config);

    console.log('✅ All system checks passed! Ready to run tests.');
  } finally {
    // Properly dispose of the request context
    await context.dispose();
  }
}

export default globalSetup;
