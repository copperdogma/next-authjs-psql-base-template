import { test, expect } from '@playwright/test';

/**
 * API Tests for the health endpoint
 */
test.describe('Health API', () => {
  test('should return health status OK', async ({ request }) => {
    // Get the response from the health endpoint
    const response = await request.get('/api/health');

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Verify the response body contains the expected values
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
      serverInfo: expect.objectContaining({
        environment: expect.any(String),
        port: expect.any(String),
      }),
    });

    // Verify uptime is a number
    expect(typeof data.uptime).toBe('number');
  });
});
