import { NextRequest, NextResponse } from 'next/server';
import {
  createTestLogin,
  validateTestEnvironment,
} from '../../../../app/api/auth/test-login/service';
import type { FirebaseAdminService, LoggerService } from '../../../../lib/interfaces/services';
import type { Auth } from 'firebase-admin/auth';
import type * as pino from 'pino';

// Mock route using relative path
jest.mock('../../../../app/api/auth/test-login/route', () => {
  const actual = jest.requireActual('../../../../app/api/auth/test-login/route');
  return {
    ...actual,
  };
});

describe.skip('Test Login Route with Dependency Injection', () => {
  // Mock dependencies
  const mockCustomToken = 'mock-firebase-token-123';

  // Mock FirebaseAdminService instance based on the INTERFACE
  const mockFirebaseAuthService: jest.Mocked<{
    createCustomToken: (uid: string, claims?: Record<string, unknown>) => Promise<string>;
    verifyIdToken: (token: string) => Promise<any>;
    getUserByUid: (uid: string) => Promise<any>;
    updateUser: (uid: string, updates: any) => Promise<any>;
    // Add getUserByEmail if it were part of the interface
  }> = {
    createCustomToken: jest.fn().mockResolvedValue(mockCustomToken),
    verifyIdToken: jest.fn(),
    getUserByUid: jest.fn(),
    updateUser: jest.fn(),
  };

  // Mock LoggerService (assuming pino.Logger)
  const mockLogger: jest.Mocked<pino.Logger> = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    level: 'info',
    bindings: jest.fn(() => ({ pid: 123, hostname: 'test' })),
    child: jest.fn(() => mockLogger),
  } as unknown as jest.Mocked<pino.Logger>; // Keep cast for pino

  // Mock NextResponse
  const mockJsonResponse = { success: true };
  const mockNextResponseJson = jest.fn().mockReturnValue({
    cookies: {
      set: jest.fn(),
    },
  });

  // Save original implementation
  const originalNextResponseJson = NextResponse.json;

  beforeAll(() => {
    // Mock NextResponse.json
    NextResponse.json = mockNextResponseJson;
  });

  afterAll(() => {
    // Restore original implementation
    NextResponse.json = originalNextResponseJson;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTestEnvironment', () => {
    it('should return null when in test environment', async () => {
      await global.withMockedEnv(
        {
          NODE_ENV: 'test',
        },
        async () => {
          const result = validateTestEnvironment(mockLogger);
          expect(result).toBeNull();
          expect(mockLogger.info).not.toHaveBeenCalled();
        }
      );
    });

    it('should return null when ALLOW_TEST_AUTH is true', async () => {
      await global.withMockedEnv(
        {
          NODE_ENV: 'production',
          ALLOW_TEST_AUTH: 'true',
        },
        async () => {
          const result = validateTestEnvironment(mockLogger);
          expect(result).toBeNull();
          expect(mockLogger.info).not.toHaveBeenCalled();
        }
      );
    });

    it('should return error response when not in test environment', async () => {
      await global.withMockedEnv(
        {
          NODE_ENV: 'production',
          ALLOW_TEST_AUTH: 'false',
        },
        async () => {
          validateTestEnvironment(mockLogger);

          expect(mockLogger.info).toHaveBeenCalledWith(
            { environment: 'production' },
            'Test authentication attempted in non-test environment'
          );

          expect(mockNextResponseJson).toHaveBeenCalledWith(
            {
              error: 'ForbiddenError',
              message: 'Test authentication is only available in test environment',
            },
            { status: 403 }
          );
        }
      );
    });

    it('should handle when NODE_ENV is undefined', async () => {
      await global.withMockedEnv(
        {
          NODE_ENV: undefined,
          ALLOW_TEST_AUTH: undefined,
        },
        async () => {
          validateTestEnvironment(mockLogger);

          expect(mockLogger.info).toHaveBeenCalledWith(
            { environment: 'undefined' },
            'Test authentication attempted in non-test environment'
          );

          expect(mockNextResponseJson).toHaveBeenCalledWith(
            {
              error: 'ForbiddenError',
              message: 'Test authentication is only available in test environment',
            },
            { status: 403 }
          );
        }
      );
    });
  });

  it('should create a handler function that processes test login requests', async () => {
    // Create the handler with injected dependencies
    const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

    // Verify handler is a function
    expect(typeof handler).toBe('function');
  });

  it('should return 403 when not in test environment', async () => {
    await global.withMockedEnv(
      {
        NODE_ENV: 'production',
        ALLOW_TEST_AUTH: 'false',
      },
      async () => {
        // Create handler
        const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

        // Create mock request
        const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
          method: 'POST',
        });

        // Call handler
        await handler(mockRequest);

        // Verify logger was called
        expect(mockLogger.info).toHaveBeenCalledWith(
          { environment: 'production' },
          'Test authentication attempted in non-test environment'
        );

        // Verify correct response
        expect(mockNextResponseJson).toHaveBeenCalledWith(
          {
            error: 'ForbiddenError',
            message: 'Test authentication is only available in test environment',
          },
          { status: 403 }
        );
      }
    );
  });

  it('should process test login successfully', async () => {
    // Create handler
    const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

    // Create mock form data
    const formData = new FormData();
    formData.append('email', 'test@example.com');

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
      method: 'POST',
    });
    mockRequest.formData = jest.fn().mockResolvedValue(formData);

    // Call handler
    await handler(mockRequest);

    // Verify Firebase service INTERFACE method was called correctly
    expect(mockFirebaseAuthService.createCustomToken).toHaveBeenCalledWith('test-user-id', {
      email: 'test@example.com',
      testAuth: true,
    });

    // Verify logger was called
    expect(mockLogger.info).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      'Creating test authentication token'
    );

    // Verify correct response
    expect(mockNextResponseJson).toHaveBeenCalledWith({
      success: true,
      token: mockCustomToken,
      user: {
        email: 'test@example.com',
        uid: 'test-user-id',
      },
    });

    // Verify cookie was set
    const response = mockNextResponseJson.mock.results[0].value;
    expect(response.cookies.set).toHaveBeenCalledWith('firebase-auth-test', mockCustomToken, {
      httpOnly: true,
      secure: false, // process.env.NODE_ENV is 'test'
      maxAge: 60 * 60,
      path: '/',
    });
  });

  it('should use default email when email is not provided in form data', async () => {
    // Create handler
    const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

    // Create empty form data without email
    const formData = new FormData();

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
      method: 'POST',
    });
    mockRequest.formData = jest.fn().mockResolvedValue(formData);

    // Call handler
    await handler(mockRequest);

    // Verify Firebase service INTERFACE method was called correctly
    expect(mockFirebaseAuthService.createCustomToken).toHaveBeenCalledWith('test-user-id', {
      email: 'test@example.com', // Default email
      testAuth: true,
    });
  });

  it('should set secure cookie in production environment', async () => {
    await global.withMockedEnv(
      {
        NODE_ENV: 'production',
        ALLOW_TEST_AUTH: 'true', // Allow testing in production for this test
      },
      async () => {
        // Create handler
        const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

        // Create mock form data
        const formData = new FormData();
        formData.append('email', 'test@example.com');

        // Create mock request
        const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
          method: 'POST',
        });
        mockRequest.formData = jest.fn().mockResolvedValue(formData);

        // Call handler
        await handler(mockRequest);

        // Verify cookie was set with secure=true in production
        const response = mockNextResponseJson.mock.results[0].value;
        expect(response.cookies.set).toHaveBeenCalledWith('firebase-auth-test', mockCustomToken, {
          httpOnly: true,
          secure: true, // Should be true in production
          maxAge: 60 * 60,
          path: '/',
        });
      }
    );
  });

  it('should handle errors gracefully', async () => {
    // Create mock error
    const mockError = new Error('Firebase auth error');

    // Create mock auth service that throws
    const errorFirebaseAuthService: FirebaseAdminService = {
      auth: jest.fn(),
      createCustomToken: jest.fn().mockRejectedValue(mockError),
      getUserByUid: jest.fn(),
      verifyIdToken: jest.fn(),
      updateUser: jest.fn(),
    };

    // Create handler
    const handler = createTestLogin(errorFirebaseAuthService, mockLogger);

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
      method: 'POST',
    });
    mockRequest.formData = jest.fn().mockResolvedValue(new FormData());

    // Call handler
    await handler(mockRequest);

    // Verify logger was called with error
    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        error: {
          message: 'Firebase auth error',
          name: 'Error',
        },
      },
      'Error in test login'
    );

    // Verify error response
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'Error',
        message: 'Firebase auth error',
        requestId: 'unknown',
      },
      { status: 500 }
    );
  });

  it('should handle non-Error objects in error handling', async () => {
    // Create a non-Error object error
    const nonErrorObject = 'String error message';

    // Create mock auth service that throws a non-Error
    const errorFirebaseAuthService: FirebaseAdminService = {
      auth: jest.fn(),
      createCustomToken: jest.fn().mockRejectedValue(nonErrorObject),
      getUserByUid: jest.fn(),
      verifyIdToken: jest.fn(),
      updateUser: jest.fn(),
    };

    // Create handler
    const handler = createTestLogin(errorFirebaseAuthService, mockLogger);

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
      method: 'POST',
    });
    mockRequest.formData = jest.fn().mockResolvedValue(new FormData());

    // Call handler
    await handler(mockRequest);

    // Verify logger was called with string error
    expect(mockLogger.error).toHaveBeenCalledWith(
      { error: 'String error message' },
      'Error in test login'
    );

    // Verify error response with new format
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'UnknownError',
        message: 'String error message',
        requestId: 'unknown',
      },
      { status: 500 }
    );
  });

  it('should handle errors in formData extraction', async () => {
    // Create handler
    const handler = createTestLogin(mockFirebaseAuthService, mockLogger);

    // Create mock request with formData that throws
    const mockRequest = new NextRequest('http://localhost/api/auth/test-login', {
      method: 'POST',
    });
    const formDataError = new Error('Invalid form data');
    mockRequest.formData = jest.fn().mockRejectedValue(formDataError);

    // Call handler
    await handler(mockRequest);

    // Verify logger was called with error
    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        error: {
          message: 'Invalid form data',
          name: 'Error',
        },
      },
      'Error in test login'
    );

    // Verify error response
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'Error',
        message: 'Invalid form data',
        requestId: 'unknown',
      },
      { status: 500 }
    );
  });
});
