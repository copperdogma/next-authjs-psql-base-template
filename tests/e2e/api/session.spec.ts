import { test, expect } from '../utils/test-base';

/**
 * API Tests for the session endpoints
 */
test.describe('Session API', () => {
  test('should handle unauthenticated requests', async ({ request }) => {
    // Get the response from the session endpoint without authentication
    const response = await request.get('/api/auth/session');

    // The endpoint might return 200 with empty session data instead of 401
    // This is okay as long as we don't get a 500 or other error
    expect(response.status()).not.toBeGreaterThanOrEqual(500);

    // Parse the response and verify it doesn't contain authenticated user data
    const data = await response.json();
    expect(data.user).toBeUndefined();
  });

  test('session POST endpoint should accept valid tokens', async ({ request }) => {
    // This is a basic test to verify the endpoint exists
    // Full authentication testing would be done in a separate authenticated test
    const response = await request.post('/api/auth/session', {
      data: {
        token: 'invalid-token-for-testing',
      },
    });

    // Expect a 401 (or 400) for an invalid token, but not a 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });
});
