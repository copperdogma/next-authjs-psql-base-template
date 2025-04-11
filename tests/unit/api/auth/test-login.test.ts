import { NextRequest, NextResponse } from 'next/server';
import {
  createTestLogin,
  validateTestEnvironment,
} from '../../../../app/api/auth/test-login/route';
import { FirebaseAdminService, LoggerService } from '../../../../lib/interfaces/services';

// Just mock the route module without exposing internal variables
jest.mock('../../../../app/api/auth/test-login/route', () => {
  const actual = jest.requireActual('../../../../app/api/auth/test-login/route');
  return {
    ...actual,
  };
});

describe('Test Login Route with Dependency Injection', () => {
  // Mock dependencies
  const mockCustomToken = 'mock-firebase-token-123';

  const mockFirebaseAuthService: FirebaseAdminService = {
    auth: jest.fn().mockReturnValue({
      createCustomToken: jest.fn().mockResolvedValue(mockCustomToken),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    }),
  };

  const mockLogger: LoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };

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
            { error: 'Test authentication is only available in test environment' },
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
          { error: 'Test authentication is only available in test environment' },
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

    // Verify Firebase service was called correctly
    expect(mockFirebaseAuthService.auth).toHaveBeenCalled();
    expect(mockFirebaseAuthService.auth().createCustomToken).toHaveBeenCalledWith('test-user-id', {
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

  it('should handle errors gracefully', async () => {
    // Create mock error
    const mockError = new Error('Firebase auth error');

    // Create mock auth service that throws
    const errorFirebaseAuthService: FirebaseAdminService = {
      auth: jest.fn().mockReturnValue({
        createCustomToken: jest.fn().mockRejectedValue(mockError),
        getUserByEmail: jest.fn(),
        updateUser: jest.fn(),
      }),
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
      { error: 'Firebase auth error' },
      'Error in test login'
    );

    // Verify error response
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: 'Failed to authenticate test user', details: 'Firebase auth error' },
      { status: 500 }
    );
  });
});
