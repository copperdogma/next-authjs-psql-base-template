import { NextRequest } from 'next/server';
// createLogger and getRequestId will be imported dynamically after jest.resetModules()
// to ensure we get the fresh mocks for each test run.

// 1. Auto-mock the logger module. This must be at the top.
jest.mock('@/lib/logger');

// 2. Define typed mock functions for logger methods that will be returned by the mocked createLogger.
// These are defined once and their call history will be cleared in beforeEach.
const mockInfo = jest.fn();
const mockWarn = jest.fn();
const mockError = jest.fn();

// Variable to hold the system under test, imported after mocks are set for each test
let logRequestResponseFn: typeof import('@/middleware/request-logger').logRequestResponse;

describe('middleware/request-logger', () => {
  let mockReq: NextRequest;
  let mockRes: Response;
  let startTime: number;

  // These will hold the fresh mock functions for createLogger and getRequestId for each test
  let currentMockedCreateLogger: jest.Mock;
  let currentMockedGetRequestId: jest.Mock;

  beforeEach(() => {
    jest.resetModules(); // Reset module cache before each test
    // jest.clearAllMocks(); // Not strictly needed here as resetModules + fresh mocks does the job for logger, and mockInfo etc are cleared below.

    // Get FRESH mock functions from the reset module system *after* resetModules
    const loggerModule = require('@/lib/logger');
    currentMockedCreateLogger = loggerModule.createLogger as jest.Mock;
    currentMockedGetRequestId = loggerModule.getRequestId as jest.Mock;

    // Clear the call history of the shared mockInfo, mockWarn, mockError functions
    mockInfo.mockClear();
    mockWarn.mockClear();
    mockError.mockClear();
    // also clear the fresh mocks themselves, as they are new for each test due to resetModules
    currentMockedCreateLogger.mockClear();
    currentMockedGetRequestId.mockClear();

    // Set up their implementations for this specific test run
    currentMockedCreateLogger.mockReturnValue({
      info: mockInfo,
      warn: mockWarn,
      error: mockError,
    });
    currentMockedGetRequestId.mockReturnValue('test-req-id');

    // Dynamically import the SUT *after* mocks are (re)configured
    logRequestResponseFn = require('@/middleware/request-logger').logRequestResponse;

    startTime = Date.now() - 100; // Simulate 100ms duration

    // Use a string URL directly in NextRequest constructor
    mockReq = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '123.0.0.1',
        'user-agent': 'TestAgent/1.0',
      },
    });
    mockRes = new Response(null, { status: 200 });
  });

  const getExpectedLogPayload = (
    status: number,
    ip?: string | null,
    userAgent?: string | null
  ) => ({
    request: {
      reqId: 'test-req-id',
      method: 'GET',
      path: '/api/test',
      ip: ip === undefined ? '123.0.0.1' : ip,
      userAgent: userAgent === undefined ? 'TestAgent/1.0' : userAgent,
    },
    response: {
      status: status,
      durationMs: expect.any(Number),
    },
  });

  it('should call logger.info for successful responses (status < 400)', () => {
    mockRes = new Response(null, { status: 201 });
    logRequestResponseFn(mockReq, mockRes, startTime);

    expect(currentMockedCreateLogger).toHaveBeenCalledWith('api-request');
    expect(currentMockedGetRequestId).toHaveBeenCalled();
    expect(mockInfo).toHaveBeenCalledWith(
      getExpectedLogPayload(201),
      'API Request Completed Successfully'
    );
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('should call logger.warn for client error responses (400 <= status < 500)', () => {
    mockRes = new Response(null, { status: 404 });
    logRequestResponseFn(mockReq, mockRes, startTime);

    expect(currentMockedCreateLogger).toHaveBeenCalledWith('api-request');
    expect(mockWarn).toHaveBeenCalledWith(
      getExpectedLogPayload(404),
      'API Request Completed with Client Error'
    );
    expect(mockInfo).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('should call logger.error for server error responses (status >= 500)', () => {
    mockRes = new Response(null, { status: 500 });
    logRequestResponseFn(mockReq, mockRes, startTime);

    expect(currentMockedCreateLogger).toHaveBeenCalledWith('api-request');
    expect(mockError).toHaveBeenCalledWith(
      getExpectedLogPayload(500),
      'API Request Completed with Server Error'
    );
    expect(mockInfo).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('should use x-real-ip if x-forwarded-for is not present', () => {
    const headers = new Headers({
      'x-real-ip': '123.0.0.2',
      'user-agent': 'TestAgent/1.0',
    });
    // Use a string URL directly in NextRequest constructor
    mockReq = new NextRequest('http://localhost/api/test', { method: 'GET', headers });
    logRequestResponseFn(mockReq, mockRes, startTime);

    expect(currentMockedCreateLogger).toHaveBeenCalledWith('api-request');
    expect(mockInfo).toHaveBeenCalledWith(
      getExpectedLogPayload(200, '123.0.0.2', 'TestAgent/1.0'),
      'API Request Completed Successfully'
    );
  });

  it('should handle missing ip and user-agent headers gracefully', () => {
    // Use a string URL directly in NextRequest constructor
    mockReq = new NextRequest('http://localhost/api/test', {
      method: 'GET',
      headers: new Headers(),
    });
    logRequestResponseFn(mockReq, mockRes, startTime);

    expect(currentMockedCreateLogger).toHaveBeenCalledWith('api-request');
    expect(mockInfo).toHaveBeenCalledWith(
      getExpectedLogPayload(200, null, null),
      'API Request Completed Successfully'
    );
  });
});
