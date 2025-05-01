/**
 * @jest-environment node
 */

// Import Next types first
import { NextRequest, NextResponse } from 'next/server';
// Import utilities & factory
import {
  getRequestId,
  getRequestPath,
  getRequestMethod,
  sanitizeHeaders,
  createApiLogger, // Import factory
} from '../../../../lib/services/api-logger-service';
import { v4 as uuidv4 } from 'uuid';

// --- Mock Dependencies ---

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-value'),
}));

// --- Mock logger-service ---
const mockBaseLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(), // Mock child to return itself
};
// Mock the factory function using the PATH ALIAS
jest.mock('@/lib/services/logger-service', () => ({
  __esModule: true,
  createContextLogger: jest.fn(() => mockBaseLogger),
}));

// --- Get a reference to the MOCKED createContextLogger ---
import { createContextLogger as mockedCreateContextLogger } from '@/lib/services/logger-service';

// Mock NextResponse.json (used by some utility tests)
const mockNextResponseJson = jest.fn().mockImplementation((data, options) => {
  return {
    status: options?.status || 200,
    data: data,
    json: () => Promise.resolve(data),
  };
});
const originalNextResponseJson = NextResponse.json;

beforeAll(() => {
  NextResponse.json = mockNextResponseJson;
});

afterAll(() => {
  NextResponse.json = originalNextResponseJson;
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// --- Tests for UTILITIES ---
describe('API Logger Service Utilities', () => {
  describe('getRequestId', () => {
    it('should extract request ID from headers if present', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('existing-request-id'),
        },
      } as unknown as NextRequest;

      const requestId = getRequestId(mockRequest);
      expect(requestId).toBe('existing-request-id');
      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-request-id');
    });

    it('should generate a new ID if not present in headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const requestId = getRequestId(mockRequest);
      expect(requestId).toBe('mock-uuid-value');
      expect(uuidv4).toHaveBeenCalled();
    });

    it('should generate a new ID when request is not provided', () => {
      const requestId = getRequestId();
      expect(requestId).toBe('mock-uuid-value');
      expect(uuidv4).toHaveBeenCalled();
    });
  });

  describe('getRequestPath', () => {
    it('should extract path from NextRequest', () => {
      const mockRequest = {
        nextUrl: {
          pathname: '/api/test',
        },
      } as unknown as NextRequest;

      const path = getRequestPath(mockRequest);
      expect(path).toBe('/api/test');
    });

    it('should extract path from standard Request', () => {
      const mockRequest = {
        url: 'http://localhost/api/test',
      } as unknown as Request;

      const path = getRequestPath(mockRequest);
      expect(path).toBe('/api/test');
    });

    it('should use default path when URL is invalid', () => {
      const mockRequest = {
        url: 'invalid-url',
      } as unknown as Request;

      const path = getRequestPath(mockRequest);
      expect(path).toBe('/unknown');
    });

    it('should extract path from URL string', () => {
      const path = getRequestPath(undefined, 'http://localhost/api/test');
      expect(path).toBe('/api/test');
    });

    it('should extract path from URL object', () => {
      const url = new URL('http://localhost/api/test');
      const path = getRequestPath(undefined, url);
      expect(path).toBe('/api/test');
    });
  });

  describe('getRequestMethod', () => {
    it('should extract method from request', () => {
      const mockRequest = {
        method: 'POST',
      } as unknown as NextRequest;

      const method = getRequestMethod(mockRequest);
      expect(method).toBe('POST');
    });

    it('should return UNKNOWN when method is not available', () => {
      const mockRequest = {} as unknown as NextRequest;
      const method = getRequestMethod(mockRequest);
      expect(method).toBe('UNKNOWN');
    });

    it('should return UNKNOWN when request is not provided', () => {
      const method = getRequestMethod();
      expect(method).toBe('UNKNOWN');
    });
  });

  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', 'Bearer token123');
      headers.set('Cookie', 'session=abc123');
      headers.set('X-API-Key', 'secret-key');
      headers.set('Set-Cookie', 'session=abc123');
      headers.set('User-Agent', 'Test Browser');

      const sanitized = sanitizeHeaders(headers);

      expect(sanitized['content-type']).toBe('application/json');
      expect(sanitized['user-agent']).toBe('Test Browser');
      expect(sanitized['authorization']).toBe('[REDACTED]');
      expect(sanitized['cookie']).toBe('[REDACTED]');
      expect(sanitized['x-api-key']).toBe('[REDACTED]');
      expect(sanitized['set-cookie']).toBe('[REDACTED]');
    });

    it('should handle empty headers', () => {
      const headers = new Headers();
      const result = sanitizeHeaders(headers);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle headers with mixed case', () => {
      const headers = new Headers();
      headers.set('Content-Type', 'text/html');
      headers.set('X-API-key', 'test-key');

      const result = sanitizeHeaders(headers);
      expect(result['content-type']).toBe('text/html');
      expect(result['x-api-key']).toBe('[REDACTED]');
    });
  });
});

// --- Tests for createApiLogger Functionality ---
describe('createApiLogger', () => {
  it('should return a logger instance', () => {
    const logger = createApiLogger();
    expect(logger).toBeDefined();
  });

  it('should create logger with default context if no request provided', () => {
    createApiLogger();
    expect(mockedCreateContextLogger).toHaveBeenCalledWith(
      'api',
      expect.objectContaining({
        baseOptions: expect.objectContaining({
          base: expect.objectContaining({
            requestId: 'mock-uuid-value',
            path: '/unknown',
            method: 'UNKNOWN',
            startTime: expect.any(Number),
          }),
        }),
        level: expect.any(String), // Default level is set
        transport: undefined, // Default transport in non-prod
      })
    );
  });

  it('should create logger with context from NextRequest', () => {
    const mockRequest = {
      headers: new Headers({ 'x-request-id': 'req-id-123' }),
      nextUrl: { pathname: '/api/data' },
      method: 'GET',
    } as unknown as NextRequest;
    createApiLogger(mockRequest);
    expect(mockedCreateContextLogger).toHaveBeenCalledWith(
      'api',
      expect.objectContaining({
        baseOptions: expect.objectContaining({
          base: expect.objectContaining({
            requestId: 'req-id-123',
            path: '/api/data',
            method: 'GET',
            startTime: expect.any(Number),
          }),
        }),
      })
    );
  });

  // --- Tests for Logger Methods ---
  describe('Logger Instance Methods', () => {
    let logger: ReturnType<typeof createApiLogger>;
    const defaultReqId = 'default-req-id';
    const defaultContextBase = {
      requestId: defaultReqId,
      path: '/unknown',
      method: 'UNKNOWN',
      startTime: expect.any(Number),
    };

    beforeEach(() => {
      // Reset and setup mocks for each test
      jest.clearAllMocks();
      (uuidv4 as jest.Mock).mockReturnValue(defaultReqId);

      // Configure the mock factory to return the base logger for these tests
      (mockedCreateContextLogger as jest.Mock).mockReturnValue(mockBaseLogger);

      // Create a logger instance for each test
      logger = createApiLogger(); // Use default context

      // Verify factory was called (to ensure logger is based on mocks)
      expect(mockedCreateContextLogger).toHaveBeenCalledWith(
        'api',
        expect.objectContaining({ baseOptions: { base: defaultContextBase } })
      );
      // Clear mocks again AFTER logger creation to isolate method call assertions
      jest.clearAllMocks();
    });

    it('info(context, message) should call base logger correctly', () => {
      const message = 'Informational log message';
      const context = { userId: 'user-abc', action: 'login' };
      logger.info(context, message);
      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      // Base context (reqId etc.) is handled by pino automatically
      // We expect the base logger to be called with only the call-specific context and message
      expect(mockBaseLogger.info).toHaveBeenCalledWith(context, message);
    });

    it('info(message) should call base logger correctly', () => {
      const message = 'Simple info message';
      logger.info(message);
      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      // When only message is passed, pino receives only the message
      expect(mockBaseLogger.info).toHaveBeenCalledWith(message);
    });

    it('warn(context, message) should call base logger correctly', () => {
      const message = 'Warning log message';
      const context = { reason: 'timeout' };
      logger.warn(context, message);
      expect(mockBaseLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.warn).toHaveBeenCalledWith(context, message);
    });

    it('error(context_with_err, message) should call base logger correctly', () => {
      const message = 'Error occurred during processing';
      const error = new Error('Something went wrong');
      const context = { operation: 'update', err: error }; // Pino convention: error under 'err' key

      logger.error(context, message);
      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith(context, message);
    });

    it('error(error_object) should call base logger correctly', () => {
      const error = new Error('Standalone error');
      logger.error(error);
      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      // When only error is passed, pino receives only the error object
      expect(mockBaseLogger.error).toHaveBeenCalledWith(error);
    });

    it('debug(context, message) should call base logger correctly', () => {
      const message = 'Debug log message';
      const context = { data: { key: 'value' } };
      logger.debug(context, message);
      expect(mockBaseLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.debug).toHaveBeenCalledWith(context, message);
    });

    it('trace(context, message) should call base logger correctly', () => {
      const message = 'Trace log message';
      const context = { step: 1 };
      logger.trace(context, message);
      expect(mockBaseLogger.trace).toHaveBeenCalledTimes(1); // Assuming trace exists on mockBaseLogger
      expect(mockBaseLogger.trace).toHaveBeenCalledWith(context, message);
    });
  });
});
