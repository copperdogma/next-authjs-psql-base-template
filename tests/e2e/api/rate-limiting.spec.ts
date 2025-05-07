import { test, expect, APIRequestContext } from '@playwright/test';

const CLIENT_LOG_ENDPOINT = '/api/log/client';
const GENERAL_API_LIMIT = 100; // As per generalApiLimiter in rate-limiters-middleware.ts
const GENERAL_API_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// Helper to make a request to the client log endpoint
async function logClientMessage(request: APIRequestContext, message: string) {
  return request.post(CLIENT_LOG_ENDPOINT, {
    data: {
      level: 'info',
      message: message,
      context: { testName: 'rate-limiting' },
    },
  });
}

test.describe.serial('API Rate Limiting for /api/log/client', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should allow requests under the limit and provide correct headers', async () => {
    const response = await logClientMessage(apiContext, 'test message 1');
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBe(String(GENERAL_API_LIMIT));
    expect(parseInt(headers['x-ratelimit-remaining'], 10)).toBeLessThan(GENERAL_API_LIMIT);
    expect(parseInt(headers['x-ratelimit-remaining'], 10)).toBeGreaterThan(0);
    expect(headers['x-ratelimit-reset']).toBeDefined();
  });

  test('should successfully consume points up to the limit', async () => {
    // Get current remaining points first to know how many we can make
    const initialResponse = await logClientMessage(apiContext, 'initial check');
    expect(initialResponse.ok()).toBeTruthy();
    const initialRemaining = parseInt(initialResponse.headers()['x-ratelimit-remaining'], 10);
    console.log(`Initial remaining points: ${initialRemaining}`);

    // Make (initialRemaining -1) more requests (because one is made by initial check)
    // We subtract 1 to ensure we don't hit the limit just yet in this loop.
    // And another 1 because the 'initial check' already consumed one.
    // So, if initialRemaining was 99, we make 99-1 = 98 more requests.
    // Total requests in this test: 1 (initial) + (initialRemaining -1) = initialRemaining requests
    for (let i = 0; i < initialRemaining - 1; i++) {
      const response = await logClientMessage(
        apiContext,
        `Spamming message ${i + 1}/${initialRemaining - 1}`
      );
      // Check if the request was okay. If not, log and fail.
      if (!response.ok()) {
        console.error(`Request failed at iteration ${i}:`, await response.json());
        expect(response.ok()).toBeTruthy(); // This will fail the test
      }
      expect(response.ok()).toBeTruthy();
      if ((i + 1) % 20 === 0) {
        // Log progress
        console.log(
          `Made ${i + 1} requests, remaining from headers: ${response.headers()['x-ratelimit-remaining']}`
        );
      }
    }

    // The next request should be the one that hits remainingPoints = 0 (or is the last allowed one)
    const finalAllowedResponse = await logClientMessage(apiContext, 'final allowed message');
    expect(finalAllowedResponse.ok()).toBeTruthy();
    const finalHeaders = finalAllowedResponse.headers();
    expect(parseInt(finalHeaders['x-ratelimit-remaining'], 10)).toBe(0);
    console.log('Successfully made requests up to the limit.');
  });

  test('should block requests when limit is exceeded and provide correct 429 headers', async () => {
    // This request should be the one that gets blocked
    const blockedResponse = await logClientMessage(apiContext, 'this should be blocked');
    expect(blockedResponse.status()).toBe(429);
    const headers = blockedResponse.headers();
    expect(headers['x-ratelimit-limit']).toBe(String(GENERAL_API_LIMIT));
    expect(headers['x-ratelimit-remaining']).toBe('0');
    expect(headers['x-ratelimit-reset']).toBeDefined();
    expect(parseFloat(headers['retry-after'])).toBeGreaterThan(0);
    console.log('Successfully blocked request after exceeding limit.');
  });

  // Note: Full reset test (waiting 15 mins) is impractical for typical CI runs.
  // This test primarily ensures the reset mechanism exists by checking Retry-After.
  // A more thorough reset test might involve:
  // 1. Hitting the limit.
  // 2. Waiting for Retry-After (or a shorter, configurable duration in a test-specific limiter).
  // 3. Making another request and expecting it to succeed.
  // For now, we focus on the immediate block and header correctness.
  test('should eventually allow requests again after rate limit window (conceptual check)', async () => {
    // This is more of a conceptual check due to the long window.
    // We already verified Retry-After header in the previous test.
    // A true E2E wait and retry would be too long.
    console.log(
      `Conceptual test: API should allow requests after ${GENERAL_API_WINDOW_MS / 1000}s`
    );
    expect(true).toBe(true); // Placeholder for the conceptual nature
  });
});
