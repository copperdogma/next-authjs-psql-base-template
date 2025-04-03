import { request } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs before all tests to ensure the application is ready
 */
async function globalSetup() {
  // Get environment configuration
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3335';
  const port = process.env.TEST_PORT || '3335';
  const healthURL = `${baseUrl}/api/health`;

  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│            🔍 E2E TEST ENVIRONMENT              │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Base URL:      ${baseUrl.padEnd(35)} │`);
  console.log(`│ Port:          ${port.padEnd(35)} │`);
  console.log(`│ Health Check:  ${healthURL.padEnd(35)} │`);
  console.log(`│ NODE_ENV:      ${(process.env.NODE_ENV || 'not set').padEnd(35)} │`);
  console.log('└─────────────────────────────────────────────────┘');

  // Check if server is ready
  console.log('⏳ Waiting for server to be ready...');

  try {
    // Create a new request context with appropriate timeout
    const context = await request.newContext({
      timeout: 30000, // 30 seconds timeout for health request
    });

    // Perform initial check to see if the server is responding
    try {
      console.log(`🔄 Testing server connection to ${baseUrl}...`);
      const initialResponse = await context
        .get(baseUrl, {
          timeout: 5000,
        })
        .catch(e => {
          console.log(`⚠️ Initial connection test failed: ${e.message}`);
          return null;
        });

      if (initialResponse) {
        console.log(`✅ Server is responding to basic requests`);
      }
    } catch (error: any) {
      console.log(`⚠️ Could not connect to base URL: ${error?.message || String(error)}`);
    }

    // Now check the health endpoint
    console.log(`🔄 Checking health endpoint at ${healthURL}...`);
    let healthCheckSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

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
          continue;
        }

        // Parse response body as JSON
        const body = await response.json();

        // Validate health check response
        if (body.status !== 'ok') {
          console.log(
            `❌ Health check attempt ${attempts}/${maxAttempts} returned non-ok status: ${JSON.stringify(body)}`
          );
          continue;
        }

        // Health check successful
        console.log('✅ Health check passed! Server is ready for testing.');
        healthCheckSuccess = true;
      } catch (error: any) {
        console.log(
          `❌ Health check attempt ${attempts}/${maxAttempts} failed: ${error?.message || String(error)}`
        );
        if (attempts < maxAttempts) {
          // Wait before retrying
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    // Properly dispose of the request context
    await context.dispose();

    if (!healthCheckSuccess) {
      throw new Error(`Health check failed after ${maxAttempts} attempts`);
    }
  } catch (error: any) {
    console.error('❌ Server health verification failed:', error?.message || String(error));
    throw error; // This will cause Playwright to stop before running tests
  }
}

export default globalSetup;
