import { NextRequest, NextResponse } from 'next/server';
import { createTestAuthService } from '@/app/api/test/auth/create-session/service';
import { FirebaseAdminService, LoggerService } from '@/lib/interfaces/services';
import { encode } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn().mockResolvedValue('mock-encoded-token'),
}));

describe('Create Session Route with Dependency Injection', () => {
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

  // Save original implementations
  const originalNextResponseJson = NextResponse.json;

  beforeAll(() => {
    // Mock NextResponse.json
    NextResponse.json = mockNextResponseJson as any;
  });

  afterAll(() => {
    // Restore original implementation
    NextResponse.json = originalNextResponseJson;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a service that processes test session requests', () => {
    // Create the service with injected dependencies
    const service = createTestAuthService(mockFirebaseAuthService, mockLogger);

    // Verify service has processCreateSessionRequest method
    expect(service).toHaveProperty('processCreateSessionRequest');
    expect(typeof service.processCreateSessionRequest).toBe('function');
  });

  it('should return 404 when test endpoints are not enabled', async () => {
    await global.withMockedEnv(
      {
        ALLOW_TEST_ENDPOINTS: '',
      },
      async () => {
        // Create service
        const service = createTestAuthService(mockFirebaseAuthService, mockLogger);

        // Create mock request
        const mockRequest = new NextRequest('http://localhost/api/test/auth/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Call service
        await service.processCreateSessionRequest(mockRequest);

        // Verify warning was logged
        expect(mockLogger.warn).toHaveBeenCalled();

        // Verify correct response
        expect(mockNextResponseJson).toHaveBeenCalledWith(
          { success: false, error: 'Test endpoints not enabled' },
          { status: 404 }
        );
      }
    );
  });

  it('should process test session creation successfully', async () => {
    // Create service
    const service = createTestAuthService(mockFirebaseAuthService, mockLogger);

    // Mock request body
    const requestBody = {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/test/auth/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Mock request json method
    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    // Call service
    await service.processCreateSessionRequest(mockRequest);

    // Verify Firebase service was called correctly
    expect(mockFirebaseAuthService.auth).toHaveBeenCalled();
    expect(mockFirebaseAuthService.auth().createCustomToken).toHaveBeenCalledWith('test-user-123', {
      email: 'test@example.com',
    });

    // Verify encode was called to create NextAuth token
    expect(encode).toHaveBeenCalledWith({
      token: {
        name: 'Test User',
        email: 'test@example.com',
        picture: null,
        sub: 'test-user-123',
      },
      secret: 'test-secret-key',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Verify success response
    expect(mockNextResponseJson).toHaveBeenCalledWith({
      success: true,
      userId: 'test-user-123',
      email: 'test@example.com',
      customToken: mockCustomToken,
      usingEmulator: true,
    });

    // Verify cookie was set
    const response = mockNextResponseJson.mock.results[0].value;
    expect(response.cookies.set).toHaveBeenCalledWith(
      'next-auth.session-token',
      'mock-encoded-token',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
      })
    );
  });

  it('should handle invalid request body', async () => {
    // Create service
    const service = createTestAuthService(mockFirebaseAuthService, mockLogger);

    // Create mock request with invalid body
    const mockRequest = new NextRequest('http://localhost/api/test/auth/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Mock request json method to return invalid data
    mockRequest.json = jest.fn().mockResolvedValue({ invalidData: true });

    // Call service
    await service.processCreateSessionRequest(mockRequest);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalled();

    // Verify error response
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  });

  it('should handle errors during token creation', async () => {
    // Create mock error
    const mockError = new Error('Token creation failed');

    // Create mock auth service that throws
    const errorFirebaseAuthService: FirebaseAdminService = {
      auth: jest.fn().mockReturnValue({
        createCustomToken: jest.fn().mockRejectedValue(mockError),
        getUserByEmail: jest.fn(),
        updateUser: jest.fn(),
      }),
    };

    // Create service
    const service = createTestAuthService(errorFirebaseAuthService, mockLogger);

    // Mock request body
    const requestBody = {
      userId: 'test-user-123',
      email: 'test@example.com',
    };

    // Create mock request
    const mockRequest = new NextRequest('http://localhost/api/test/auth/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Mock request json method
    mockRequest.json = jest.fn().mockResolvedValue(requestBody);

    // Call service
    await service.processCreateSessionRequest(mockRequest);

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalled();

    // Verify error response
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { success: false, error: 'Token creation failed' },
      { status: 500 }
    );
  });
});
