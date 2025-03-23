import { GET } from '../../mocks/app/api/health/route';
import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '../../utils/test-constants';

describe('Health API', () => {
  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    // Check response is a NextResponse with correct status code
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(HTTP_STATUS.OK);

    // Use partial matching instead of exact matching for resiliency
    expect(data).toEqual(
      expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
        // The implementation could add additional fields later without breaking the test
      })
    );

    // Verify specific fields are valid
    expect(data.status).toBe('healthy');
    expect(() => new Date(data.timestamp)).not.toThrow();

    // Verify timestamp is recent (within last minute)
    const timestamp = new Date(data.timestamp);
    const now = new Date();
    expect(now.getTime() - timestamp.getTime()).toBeLessThan(60000);
  });
});
