import { request } from '@playwright/test';
import axios from 'axios';

/**
 * Global setup for E2E tests
 * Runs before all tests to ensure the application is ready
 * Also handles clearing Firebase emulator data for clean test runs
 */
async function globalSetup() {
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

  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│            🔍 E2E TEST ENVIRONMENT              │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Base URL:      ${baseUrl.padEnd(35)} │`);
  console.log(`│ Port:          ${port.padEnd(35)} │`);
  console.log(`│ Health Check:  ${healthURL.padEnd(35)} │`);
  console.log(`│ Auth Emulator: ${authEmulatorUrl.padEnd(35)} │`);
  console.log(`│ NODE_ENV:      ${(process.env.NODE_ENV || 'not set').padEnd(35)} │`);
  console.log('└─────────────────────────────────────────────────┘');

  // Create a new request context with appropriate timeout
  const context = await request.newContext({
    timeout: 30000, // 30 seconds timeout for requests
  });

  // Clear emulator data
  console.log('🧹 Clearing Firebase emulator data...');

  try {
    // Clear Firestore data
    console.log(`Clearing Firestore data at ${firestoreClearUrl}...`);
    try {
      const firestoreResponse = await axios.delete(firestoreClearUrl);
      console.log(`✅ Firestore data cleared. Status: ${firestoreResponse.status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to clear Firestore data: ${errorMessage}`);
      console.warn('This is not critical if you are not using Firestore in your tests');
    }

    // Clear Auth data
    console.log(`Clearing Auth data at ${authClearUrl}...`);
    try {
      const authResponse = await axios.delete(authClearUrl);
      console.log(`✅ Auth data cleared. Status: ${authResponse.status}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to clear Auth data: ${errorMessage}`);
      console.warn('This may cause tests to fail if they depend on specific auth states');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Error clearing emulator data: ${errorMessage}`);
    // Non-fatal error - continue with the tests
  }

  // Now check the app server health endpoint
  console.log(`🔄 Checking application health endpoint at ${healthURL}...`);
  let healthCheckSuccess = false;
  let attempts = 0;
  const maxAttempts = 5;
  const retryDelay = 5000; // 5 seconds between retries

  while (!healthCheckSuccess && attempts < maxAttempts) {
    attempts++;
    try {
      const response = await context.get(healthURL, {
        timeout: 10000, // 10 seconds timeout per attempt
      });

      // Check if the response is OK (status 200-299)
      if (!response.ok()) {
        console.log(
          `❌ Health check attempt ${attempts}/${maxAttempts} failed with status ${response.status()}`
        );
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }

      // Parse response body as JSON
      const body = await response.json();

      // Validate health check response
      if (body.status !== 'ok') {
        console.log(
          `❌ Health check attempt ${attempts}/${maxAttempts} returned non-ok status: ${JSON.stringify(body)}`
        );
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }

      // Health check successful
      console.log('✅ Application health check passed! Server is ready for testing.');
      healthCheckSuccess = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Health check attempt ${attempts}/${maxAttempts} failed: ${errorMessage}`);
      if (attempts < maxAttempts) {
        // Wait before retrying
        console.log(`⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Properly dispose of the request context
  await context.dispose();

  if (!healthCheckSuccess) {
    throw new Error(`Health check failed after ${maxAttempts} attempts`);
  }

  console.log('✅ All system checks passed! Ready to run tests.');
}

export default globalSetup;
