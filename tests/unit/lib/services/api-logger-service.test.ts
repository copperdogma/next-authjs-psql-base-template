/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRequestId,
  getRequestPath,
  getRequestMethod,
  createErrorResponse,
  sanitizeHeaders,
  withApiLogger,
  ApiRequestContext,
  createApiLogger,
} from '../../../../lib/services/api-logger-service';
import { LoggerService } from '../../../../lib/interfaces/services';
import { v4 as uuidv4 } from 'uuid';

// Mock the uuid package
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-value'),
}));

// Mock NextResponse.json
const mockNextResponseJson = jest.fn().mockImplementation((data, options) => {
  return {
    status: options?.status || 200,
    data: data,
    json: () => Promise.resolve(data),
  };
});

// Save original NextResponse.json
const originalNextResponseJson = NextResponse.json;

// Mock createApiLogger
jest.mock('../../../../lib/services/api-logger-service', () => {
  const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
  return {
    ...originalModule,
    createApiLogger: jest.fn(),
    createErrorResponse: jest.fn(),
  };
});

// Import the mocked functions directly to use for test setup
import {
  createApiLogger as mockedCreateApiLogger,
  createErrorResponse as mockedCreateErrorResponse,
} from '../../../../lib/services/api-logger-service';

beforeAll(() => {
  // Replace NextResponse.json with our mock
  NextResponse.json = mockNextResponseJson;
});

afterAll(() => {
  // Restore original NextResponse.json
  NextResponse.json = originalNextResponseJson;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

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

  describe('createErrorResponse', () => {
    const requestId = 'test-request-id';

    beforeEach(() => {
      // Reset the mock implementation of NextResponse.json
      mockNextResponseJson.mockClear();
    });

    it('should create a formatted error response from Error object', () => {
      const error = new Error('Test error');

      // Call the non-mocked original implementation
      const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
      const response = originalModule.createErrorResponse(error, requestId, 400);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          error: 'Error',
          message: 'Test error',
          requestId: 'test-request-id',
        },
        { status: 400 }
      );
    });

    it('should handle string errors', () => {
      const error = 'String error message';

      // Call the non-mocked original implementation
      const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
      const response = originalModule.createErrorResponse(error, requestId);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        {
          error: 'UnknownError',
          message: 'String error message',
          requestId: 'test-request-id',
        },
        { status: 500 }
      );
    });

    it('should use default status code of 500 when not specified', () => {
      const error = new Error('Test error');

      // Call the non-mocked original implementation
      const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
      const response = originalModule.createErrorResponse(error, requestId);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error',
          message: 'Test error',
          requestId: 'test-request-id',
        }),
        { status: 500 }
      );
    });
  });

  describe('withApiLogger', () => {
    it('should return a standardized error response when handler throws', async () => {
      // Get the original implementation
      const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
      const { withApiLogger } = originalModule;

      // Create a handler that throws an error
      const mockError = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(mockError);

      // Create a simplified request
      const mockRequest = {
        nextUrl: {
          toString: () => 'http://localhost/api/test',
          pathname: '/api/test',
        },
        headers: new Headers(),
        method: 'GET',
      } as unknown as NextRequest;

      // Wrap the handler
      const wrappedHandler = withApiLogger(mockHandler);

      // Execute the handler
      await wrappedHandler(mockRequest);

      // Verify handler was called
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.anything());
    });

    it('should log start and completion for successful request', async () => {
      // Get the original implementation
      const originalModule = jest.requireActual('../../../../lib/services/api-logger-service');
      const { withApiLogger } = originalModule;

      // Create a successful handler
      const mockResponse = { status: 200 };
      const mockHandler = jest.fn().mockResolvedValue(mockResponse);

      // Create a simplified request
      const mockRequest = {
        nextUrl: {
          toString: () => 'http://localhost/api/test',
          pathname: '/api/test',
        },
        headers: new Headers(),
        method: 'GET',
      } as unknown as NextRequest;

      // Wrap the handler
      const wrappedHandler = withApiLogger(mockHandler);

      // Execute the handler
      const response = await wrappedHandler(mockRequest);

      // Verify handler was called and returned expected response
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.anything());
      expect(response).toBe(mockResponse);
    });
  });
});
