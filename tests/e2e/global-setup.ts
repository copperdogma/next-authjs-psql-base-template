import { request } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs before all tests to ensure the application and emulators are ready
 */
async function globalSetup() {
  // Get environment configuration
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
  const port = process.env.TEST_PORT || '3777';
  const healthURL = `${baseUrl}/api/health`;
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│            🔍 E2E TEST ENVIRONMENT              │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Base URL:      ${baseUrl.padEnd(35)} │`);
  console.log(`│ Port:          ${port.padEnd(35)} │`);
  console.log(`│ Health Check:  ${healthURL.padEnd(35)} │`);
  console.log(`│ Auth Emulator: ${authEmulatorUrl.padEnd(35)} │`);
  console.log(`│ NODE_ENV:      ${(process.env.NODE_ENV || 'not set').padEnd(35)} │`);
  console.log('└─────────────────────────────────────────────────┘');

  // Check if emulators and server are ready
  try {
    // Create a new request context with appropriate timeout
    const context = await request.newContext({
      timeout: 30000, // 30 seconds timeout for health request
    });

    // Check Firebase Auth emulator
    console.log(`🔄 Checking Firebase Auth emulator at ${authEmulatorUrl}...`);
    try {
      // Try a more reliable endpoint for the Firebase Auth emulator
      const authEmulatorResponse = await context.get(
        `${authEmulatorUrl}/emulator/v1/projects/next-firebase-base-template`,
        {
          timeout: 10000,
        }
      );

      // Accept both OK and 404 status - either means the emulator is running
      if (authEmulatorResponse.ok() || authEmulatorResponse.status() === 404) {
        console.log('✅ Firebase Auth emulator is ready');
      } else {
        throw new Error(
          `Firebase Auth emulator returned unexpected status ${authEmulatorResponse.status()}`
        );
      }
    } catch (error: unknown) {
      // If it's a 404 error, the emulator is running but the endpoint is different
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404')) {
        console.log("✅ Firebase Auth emulator is running (returned 404 but that's OK)");
      } else {
        console.error(`❌ Firebase Auth emulator check failed: ${errorMessage}`);
        console.log(
          'Make sure Firebase emulators are running with: npm run firebase:emulators:import'
        );
        throw new Error('Firebase Auth emulator is not ready');
      }
    }

    // Check Firestore emulator
    console.log(`🔄 Checking Firestore emulator at ${firestoreEmulatorUrl}...`);
    try {
      const firestoreEmulatorResponse = await context.get(firestoreEmulatorUrl, {
        timeout: 10000,
      });
      if (firestoreEmulatorResponse.ok() || firestoreEmulatorResponse.status() === 400) {
        // Firestore emulator may return 400 but it's still running
        console.log('✅ Firestore emulator is ready');
      } else {
        throw new Error(
          `Firestore emulator returned unexpected status ${firestoreEmulatorResponse.status()}`
        );
      }
    } catch (error: unknown) {
      // Accept network errors from Firestore emulator - it's not critical for all tests
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Firestore emulator check: ${errorMessage}`);
      console.log('Continuing anyway as not all tests require Firestore...');
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ System verification failed:', errorMessage);
    throw error; // This will cause Playwright to stop before running tests
  }
}

export default globalSetup;
