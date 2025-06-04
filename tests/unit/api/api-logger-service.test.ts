// Define the mock v4 function explicitly FIRST
const mockV4 = jest.fn<() => string>().mockReturnValue('mock-uuid-value');

// Import the actual uuid module to require its actuals
import * as uuid from 'uuid';
import type pino from 'pino';
import type { Mock } from 'jest-mock';

// Mock the uuid module at the top level, overriding only v4
jest.mock('uuid', () => ({
  __esModule: true,
  ...jest.requireActual<typeof uuid>('uuid'), // Keep other exports
  v4: mockV4, // Override v4
}));

// Standard imports AFTER top-level mocks
import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Import ACTUAL functions from the module under test
import {
  createApiLogger,
  getRequestId,
  getRequestPath,
  getRequestMethod,
  sanitizeHeaders,
  withApiLogger,
} from '../../../lib/services/api-logger-service';

// Create a mock logger factory
const createMockPinoLogger = (bindings = {}) => {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: 'info',
    bindings: jest.fn().mockReturnValue(bindings),
  } as unknown as jest.Mocked<pino.Logger>;
};

// Set up a constant for our mock request ID
const MOCK_REQUEST_ID = 'mock-request-id';

// Mock the base logger module with a predictable getRequestId function
jest.mock('../../../lib/logger', () => ({
  createLogger: jest.fn((_name: string, context?: Record<string, unknown>) =>
    createMockPinoLogger(context || {})
  ),
  getRequestId: jest.fn().mockImplementation(() => MOCK_REQUEST_ID),
}));

// Don't mock api-logger-service at all - test the real implementation
jest.unmock('../../../lib/services/api-logger-service');

// Mock next/server
jest.mock('next/server', () => {
  // Add import type and cast for requireActual
  const actual = jest.requireActual('next/server') as typeof import('next/server');
  // Simplified mock for testing purposes
  return {
    NextResponse: {
      json: jest.fn(
        (body, opts) =>
          new Response(JSON.stringify(body), {
            ...(opts ?? {}),
            headers: { 'content-type': 'application/json' },
          })
      ),
    },
    NextRequest: actual.NextRequest, // Use actual NextRequest
  };
});

// --- Test Suite --- //
describe('API Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the uuid mock
    mockV4.mockClear().mockReturnValue('mock-uuid-value');

    // Reset next/server mock
    const mockedNextServer = jest.requireMock('next/server') as any;
    if (mockedNextServer.NextResponse.json.mockClear) {
      mockedNextServer.NextResponse.json.mockClear();
    }
  });

  // Test the ACTUAL getRequestId function
  describe('getRequestId', () => {
    it('should use header ID if present', () => {
      const mockReq = new NextRequest('http://test.com', {
        headers: { 'x-request-id': 'header-test-id' },
      });
      const id = getRequestId(mockReq);
      expect(id).toBe('header-test-id');
    });

    it('should use the base getRequestId when no header is present', () => {
      const mockReq = new NextRequest('http://test.com');
      const id = getRequestId(mockReq);
      expect(id).toBe('mock-request-id');
    });

    it('should use the base getRequestId when no request is provided', () => {
      const id = getRequestId();
      expect(id).toBe('mock-request-id');
    });
  });

  // Test internal helpers directly
  describe('getRequestPath', () => {
    it('should extract path from NextRequest', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/test');
      const path = getRequestPath(mockReq);
      expect(path).toBe('/api/test');
    });

    it('should extract path from URL object', () => {
      const url = new URL('http://localhost:3000/api/data');
      const path = getRequestPath(undefined, url);
      expect(path).toBe('/api/data');
    });

    it('should extract path from valid URL string', () => {
      const path = getRequestPath(undefined, 'http://localhost:3000/api/users');
      expect(path).toBe('/api/users');
    });

    it('should return standardized placeholder for invalid URL string', () => {
      const path = getRequestPath(undefined, 'invalid-url-string');
      expect(path).toBe('/malformed_url_string');
    });

    it('should return /unknown when no request or URL is provided', () => {
      const path = getRequestPath();
      expect(path).toBe('/unknown');
    });
  });

  describe('getRequestMethod', () => {
    it('should extract method from request', () => {
      const mockReq = new NextRequest('http://test.com', { method: 'POST' });
      const method = getRequestMethod(mockReq);
      expect(method).toBe('POST');
    });
  });

  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = new Headers({
        authorization: 'Bearer token123',
        cookie: 'sessionId=abc123',
        'x-api-key': 'secret-key',
        'content-type': 'application/json',
      });
      const result = sanitizeHeaders(headers);
      expect(result.authorization).toBe('[REDACTED]');
      expect(result.cookie).toBe('[REDACTED]');
      expect(result['x-api-key']).toBe('[REDACTED]');
      expect(result['content-type']).toBe('application/json');
    });
  });

  // Test the ACTUAL createApiLogger function
  describe('createApiLogger', () => {
    it('should return logger with context using header ID', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/data', {
        headers: { 'x-request-id': 'req-abc' },
      });

      const { logger } = createApiLogger(mockReq);

      expect(logger).toBeDefined();
      // Verify our mock logger was created with the expected context
      const mockCreateLogger = (jest.requireMock('../../../lib/logger') as any).createLogger;
      expect(mockCreateLogger).toHaveBeenCalledWith(
        'api',
        expect.objectContaining({
          requestId: 'req-abc',
          path: '/api/data',
        })
      );
    });

    it('should return logger with context using generated ID when no header', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/profile');
      const { logger, startTime } = createApiLogger(mockReq);

      expect(logger).toBeDefined();
      expect(startTime).toBeDefined();

      // Verify our mock logger was created with the expected context
      const mockCreateLogger = (jest.requireMock('../../../lib/logger') as any).createLogger;
      expect(mockCreateLogger).toHaveBeenCalledWith(
        'api',
        expect.objectContaining({
          requestId: 'mock-request-id', // Use our known mock value
          path: '/api/profile',
        })
      );
    });

    it('should correctly extract path and method from request', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: new Headers({ 'x-request-id': 'req-abc' }),
      });

      createApiLogger(mockReq);

      // Verify our mock logger was created with the expected context
      const mockCreateLogger = (jest.requireMock('../../../lib/logger') as any).createLogger;
      expect(mockCreateLogger).toHaveBeenCalledWith(
        'api',
        expect.objectContaining({
          requestId: 'req-abc',
          path: '/api/test',
          method: 'POST',
        })
      );
    });
  });

  // Test the ACTUAL withApiLogger function
  describe('withApiLogger', () => {
    let mockPinoLogger: jest.Mocked<pino.Logger>;

    beforeEach(() => {
      // Set up mock pino logger instance for these tests
      mockPinoLogger = createMockPinoLogger({ component: 'api', requestId: 'mock-req-id' });

      // Mock createLogger to return our mock instance
      const mockCreateLogger = (jest.requireMock('../../../lib/logger') as any)
        .createLogger as Mock;
      mockCreateLogger.mockReturnValue(mockPinoLogger);

      // Mock Date.now to return consistent value
      jest.spyOn(Date, 'now').mockReturnValue(1000);
    });

    it('should wrap handler, log start/completion, and call handler', async () => {
      const mockReq = new NextRequest('http://localhost/api/test');

      // Create a basic handler that returns a NextResponse
      const successResponse = NextResponse.json({ success: true });
      const mockHandler = jest
        .fn<(req: NextRequest) => Promise<Response>>()
        .mockResolvedValue(successResponse);

      // Create a type assertion to help TypeScript understand the API
      type ApiHandler = (req: NextRequest) => Promise<Response>;
      const typedWithApiLogger = withApiLogger as unknown as (handler: ApiHandler) => ApiHandler;
      const wrappedHandler = typedWithApiLogger(mockHandler);

      await wrappedHandler(mockReq);

      // Check handler was called
      expect(mockHandler).toHaveBeenCalled();
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should handle errors and return error response', async () => {
      const mockReq = new NextRequest('http://localhost/api/error');
      const error = new Error('Handler failed');

      // Create a handler that throws
      const mockHandler = jest
        .fn<(req: NextRequest) => Promise<Response>>()
        .mockRejectedValue(error);

      // Create a type assertion to help TypeScript understand the API
      type ApiHandler = (req: NextRequest) => Promise<Response>;
      const typedWithApiLogger = withApiLogger as unknown as (handler: ApiHandler) => ApiHandler;
      const wrappedHandler = typedWithApiLogger(mockHandler);

      const response = await wrappedHandler(mockReq);

      // Verify error handling
      expect(mockHandler).toHaveBeenCalled();
      expect(mockPinoLogger.error).toHaveBeenCalled();
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe('Error');
    });
  });
});
