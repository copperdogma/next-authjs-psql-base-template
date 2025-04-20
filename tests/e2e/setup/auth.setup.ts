import { test as setup, expect, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// No Firebase client imports needed here anymore

const STORAGE_STATE = path.join(__dirname, '../../.auth/user.json');
const customTokenPath = path.join(__dirname, '../../.auth/custom-token.txt');

// We still need the base URL and the API endpoint URL
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
const CREATE_SESSION_URL = `${BASE_URL}/api/test/auth/create-session`;

/**
 * Reads the custom Firebase token from the filesystem.
 * @throws Error if the file cannot be read or is empty.
 */
async function readCustomToken(): Promise<string> {
  console.log(` Reading custom token from ${customTokenPath}...`);
  try {
    const customToken = fs.readFileSync(customTokenPath, 'utf8').trim();
    if (!customToken) throw new Error('Custom token file is empty.');
    console.log(` Read custom token successfully.`);
    return customToken;
  } catch (error) {
    console.error(`❌ Failed to read custom token from ${customTokenPath}:`, error);
    throw error;
  }
}

/**
 * Calls the backend API endpoint to create a session using the custom token.
 * @param request - The Playwright APIRequestContext.
 * @param customToken - The Firebase custom token.
 * @returns The JSON response from the API.
 * @throws Error if the API call fails.
 */
async function createSessionViaApi(request: APIRequestContext, customToken: string): Promise<any> {
  console.log(` Sending Custom Token to API endpoint: ${CREATE_SESSION_URL}`);
  try {
    const apiResponse = await request.post(CREATE_SESSION_URL, {
      data: { customToken },
      failOnStatusCode: false,
    });

    if (!apiResponse.ok()) {
      const responseBody = await apiResponse.text();
      console.error(`❌ API endpoint failed with status ${apiResponse.status()}: ${responseBody}`);
      try {
        const errorJson = JSON.parse(responseBody);
        console.error('❌ API Error JSON:', errorJson);
      } catch {
        /* Ignore parsing error */
      }
      throw new Error(
        `API endpoint ${CREATE_SESSION_URL} failed with status ${apiResponse.status()}`
      );
    }

    const apiResponseJson = await apiResponse.json();
    console.log('✅ API endpoint successful:', apiResponseJson);
    return apiResponseJson;
  } catch (error) {
    console.error('❌ Error calling API endpoint:', error);
    throw error;
  }
}

/**
 * Verifies that the session cookie is present in the saved storage state.
 * @param storagePath - Path to the saved storage state file.
 * @param apiResponseJson - The JSON response from the API (for logging).
 * @throws Error if the cookie is not found.
 */
function verifySessionCookie(storagePath: string, apiResponseJson: any): void {
  console.log(` Verifying session cookie in ${storagePath}...`);
  const contextState = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
  const sessionCookie = contextState.cookies.find((c: { name: string }) =>
    c.name.includes('next-auth.session-token')
  );

  expect(
    sessionCookie,
    `Session cookie MUST be set after successful API call. Check API response and logs. API Response JSON: ${JSON.stringify(apiResponseJson)}`
  ).toBeDefined();

  if (sessionCookie) {
    console.log(`🍪 Verified session cookie (${sessionCookie.name}) presence in saved state.`);
  }
}

setup.describe('Authentication Setup via API Endpoint', () => {
  setup.setTimeout(60000); // Reduced timeout slightly, evaluate step removed

  setup('authenticate via custom token and API', async ({ request }) => {
    // Only need 'request' fixture
    console.log('🚀 Starting authentication setup via API endpoint...');

    // 1. Read custom token
    const customToken = await readCustomToken();

    // 2. Create session via API
    const apiResponseJson = await createSessionViaApi(request, customToken);

    // 3. Save storage state (includes cookie set by API response)
    await request.storageState({ path: STORAGE_STATE });
    console.log(`💾 Authentication state saved to ${STORAGE_STATE}`);

    // 4. Verify session cookie exists
    verifySessionCookie(STORAGE_STATE, apiResponseJson);

    console.log('🎉 Authentication setup via API Endpoint complete!');
  });
});
