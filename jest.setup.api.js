/**
 * Factory functions for browser API mocks in Jest tests
 * Each function creates a constructor for a specific API class
 *
 * IMPORTANT: This file both exports factory functions AND sets up the global environment.
 * This design prevents circular dependencies between this file and tests/mocks/jest-api-setup.js,
 * allowing tests to import from either location as needed without creating import cycles.
 */

import '@testing-library/jest-dom';
import { afterEach, jest } from '@jest/globals';

import { mockSession } from './__mocks__/data/mockData';

/**
 * Create the Request class constructor
 */
export function createRequestMock() {
  return class Request {
    constructor(input, init = {}) {
      this._url = typeof input === 'string' ? new URL(input, 'http://localhost') : input;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers || {});
      this.body = init.body;
    }

    get url() {
      return this._url.toString();
    }
  };
}

/**
 * Create the Headers class constructor
 */
export function createHeadersMock() {
  return class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }

    append(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    delete(name) {
      this._headers.delete(name.toLowerCase());
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    entries() {
      return this._headers.entries();
    }
  };
}

/**
 * Create the Response class constructor
 */
export function createResponseMock() {
  return class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new (createHeadersMock())(init.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }

    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }
  };
}

/**
 * Create NextRequest constructor function
 */
export function createNextRequestMock() {
  return class NextRequest extends Request {
    constructor(input, init = {}) {
      super(input, init);
      this.nextUrl = new URL(typeof input === 'string' ? input : input.url, 'http://localhost');
    }
  };
}

/**
 * Create NextResponse object with json and redirect methods
 */
export function createNextResponseMock() {
  const MockedResponse = createResponseMock();

  return {
    json: (body, init = {}) => {
      const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
      const response = new MockedResponse(jsonBody, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          'content-type': 'application/json',
        },
      });

      response.cookies = {
        set: jest.fn(),
        get: jest.fn(name =>
          name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
            ? { name, value: mockSession.sessionToken }
            : undefined
        ),
        delete: jest.fn(),
        getAll: jest.fn(name =>
          name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
            ? [{ name, value: mockSession.sessionToken }]
            : []
        ),
        has: jest.fn(
          name => name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
        ),
      };

      return response;
    },
    redirect: jest.fn((url, init = {}) => {
      const status = init.status || 302;
      const responseHeaders = new (createHeadersMock())({
        location: url.toString(),
        ...(init.headers || {}),
      });

      const redirectResponse = {
        url: url.toString(),
        status: status,
        headers: responseHeaders,
        ok: status >= 200 && status < 400,
        body: null,
        bodyUsed: true,
        json: jest.fn(() => Promise.resolve({})),
        text: jest.fn(() => Promise.resolve('')),
        cookies: {
          set: jest.fn(),
          get: jest.fn(name =>
            name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
              ? { name, value: mockSession.sessionToken }
              : undefined
          ),
          delete: jest.fn(),
          getAll: jest.fn(name =>
            name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
              ? [{ name, value: mockSession.sessionToken }]
              : []
          ),
          has: jest.fn(
            name =>
              name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token'
          ),
        },
      };

      return redirectResponse;
    }),
  };
}

// Setup the API environment directly
if (typeof global.Request === 'undefined') {
  global.Request = createRequestMock();
}

if (typeof global.Headers === 'undefined') {
  global.Headers = createHeadersMock();
}

if (typeof global.Response === 'undefined') {
  global.Response = createResponseMock();
}

// Mock Next.js server
jest.mock('next/server', () => {
  return {
    NextRequest: createNextRequestMock(),
    NextResponse: createNextResponseMock(),
  };
});

// Setup global mock values
globalThis.mockAuthSession = mockSession;

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Additional API-specific setup can be added here
