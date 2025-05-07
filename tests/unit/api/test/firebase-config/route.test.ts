import { GET } from '../../../../../app/api/test/firebase-config/route';
import { NextResponse } from 'next/server';

// Mock next/server
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => ({
        // Simulate a Response-like object for status checking
        json: async () => body,
        status: init?.status || 200,
        ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      })),
    },
  };
});

const mockedNextResponseJson = NextResponse.json as jest.Mock;

describe('GET /api/test/firebase-config', () => {
  const OLD_ENV = process.env;
  let mutableEnv: Record<string, string | undefined>;

  beforeEach(() => {
    jest.resetModules(); // Crucial for NODE_ENV changes to take effect in tested module
    // Create a mutable copy of process.env for testing purposes
    mutableEnv = { ...OLD_ENV };
    process.env = mutableEnv as NodeJS.ProcessEnv; // Temporarily cast for assignment if needed by other code
    mockedNextResponseJson.mockClear();
  });

  afterEach(() => {
    process.env = OLD_ENV; // Restore original environment
  });

  it('should return 403 if NODE_ENV is production', async () => {
    mutableEnv.NODE_ENV = 'production';
    const response = await GET();

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({
      message: 'Forbidden: This endpoint is not available in production.',
    });
    expect(mockedNextResponseJson).toHaveBeenCalledWith(
      { message: 'Forbidden: This endpoint is not available in production.' },
      { status: 403 }
    );
  });

  it('should return 200 and config if NODE_ENV is not production (e.g., development)', async () => {
    mutableEnv.NODE_ENV = 'development';
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Firebase Configuration');
    expect(body.clientConfig).toBeDefined();
    expect(body.serverConfig).toBeDefined();
    expect(body.nodeEnv).toBe('development');
    expect(mockedNextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Firebase Configuration',
        nodeEnv: 'development',
      })
      // We don't assert the full init object here as NextResponse.json mock doesn't pass it through
    );
  });

  it('should return 200 and config if NODE_ENV is not production (e.g., test)', async () => {
    mutableEnv.NODE_ENV = 'test';
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Firebase Configuration');
    expect(body.clientConfig).toBeDefined();
    expect(body.serverConfig).toBeDefined();
    expect(body.nodeEnv).toBe('test');
    expect(mockedNextResponseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Firebase Configuration',
        nodeEnv: 'test',
      })
    );
  });
});
