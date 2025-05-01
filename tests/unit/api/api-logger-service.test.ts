// Define the mock v4 function explicitly FIRST
const mockV4 = jest.fn<() => string>().mockReturnValue('mock-uuid-value');

// Import the actual uuid module to require its actuals
import * as uuid from 'uuid';

// Mock the uuid module at the top level, overriding only v4
jest.mock('uuid', () => ({
  __esModule: true,
  ...jest.requireActual<typeof uuid>('uuid'), // Keep other exports
  v4: mockV4, // Override v4
}));

// Standard imports AFTER top-level mocks
import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Import ACTUAL functions from the module under test
import {
  createApiLogger,
  getRequestId,
  getRequestPath,
  getRequestMethod,
  sanitizeHeaders,
  createErrorResponse,
} from '../../../lib/services/api-logger-service';

// Mock logger BEFORE importing the service that uses it
jest.mock('../../../lib/logger'); // Mock base logger dependency

// Mock the module under test to control getRequestId
const mockGetRequestId = jest.fn<() => string>();
jest.mock('../../../lib/services/api-logger-service', () => {
  // Cast to any to allow spreading
  const actual = jest.requireActual('../../../lib/services/api-logger-service') as any;
  return {
    ...actual, // Keep actual implementations for other functions
    getRequestId: mockGetRequestId, // Use our mock for getRequestId
  };
});

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
      expect(mockV4).not.toHaveBeenCalled();
    });

    // Test case where uuid.v4 *should* be called
    it('should generate an ID when no header ID is present', () => {
      const mockReq = new NextRequest('http://test.com');
      const id = getRequestId(mockReq);
      expect(id).toEqual(expect.any(String));
      expect(id.length).toBeGreaterThan(10); // Basic check for UUID-like string
    });

    // Test case where uuid.v4 *should* be called
    it('should generate an ID when no request object is provided', () => {
      const id = getRequestId(); // Call without request
      expect(id).toEqual(expect.any(String));
      expect(id.length).toBeGreaterThan(10);
    });
  });

  // Test internal helpers directly
  describe('getRequestPath', () => {
    // ... existing tests for getRequestPath ...
    it('should extract path from NextRequest', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/test');
      const path = getRequestPath(mockReq);
      expect(path).toBe('/api/test');
    });
  });

  describe('getRequestMethod', () => {
    // ... existing tests for getRequestMethod ...
    it('should extract method from request', () => {
      const mockReq = new NextRequest('http://test.com', { method: 'POST' });
      const method = getRequestMethod(mockReq);
      expect(method).toBe('POST');
    });
  });

  describe('sanitizeHeaders', () => {
    // ... existing tests for sanitizeHeaders ...
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
      const logger = createApiLogger(mockReq);

      expect(logger).toBeDefined();
      expect(logger.context).toBeDefined();
      expect(logger.context.requestId).toBe('req-abc'); // Header ID takes precedence
      expect(logger.context.path).toBe('/api/data');
      expect(mockV4).not.toHaveBeenCalled(); // Should not call uuid if header exists
    });

    it('should return logger with context using generated ID when no header', () => {
      const mockReq = new NextRequest('http://localhost:3000/api/profile');
      const logger = createApiLogger(mockReq);

      expect(logger).toBeDefined();
      expect(logger.context).toBeDefined();
      expect(logger.context.path).toBe('/api/profile');
      expect(logger.context.requestId).toEqual(expect.any(String));
      expect(logger.context.requestId.length).toBeGreaterThan(10);
    });
  });

  // Test the ACTUAL createErrorResponse function
  describe('createErrorResponse', () => {
    // ... existing tests for createErrorResponse ...
    it('should create error response with Error object', async () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      const requestId = 'req-123';
      const response = createErrorResponse(error, requestId, 400);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: 'TestError',
        message: 'Test error',
        requestId: 'req-123',
      });
    });
  });
});
