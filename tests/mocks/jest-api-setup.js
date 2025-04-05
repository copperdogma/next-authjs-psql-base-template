/**
 * Setup for Jest API mocks
 * This file initializes all the mock API classes needed for testing
 */
import {
  createRequestClass,
  createHeadersClass,
  createResponseClass,
  createNextRequestClass,
} from '../jest.setup.api';

/**
 * Initialize all global API mocks and Next.js server mocks
 */
export function createJestApiSetup() {
  // Set up global objects if not defined
  if (typeof global.Request === 'undefined') {
    global.Request = createRequestClass();
  }

  if (typeof global.Headers === 'undefined') {
    global.Headers = createHeadersClass();
  }

  if (typeof global.Response === 'undefined') {
    global.Response = createResponseClass();
  }

  // Import Next.js server after setting up the API classes
  jest.mock('next/server', () => {
    return {
      NextRequest: createNextRequestClass(),
      NextResponse: {
        json: (body, init = {}) => {
          const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
          const response = new global.Response(jsonBody, {
            ...init,
            headers: {
              ...init?.headers,
              'content-type': 'application/json',
            },
          });

          // Add cookies functionality
          response.cookies = {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          };

          return response;
        },
        redirect: jest.fn(url => {
          return {
            url,
            status: 302,
            headers: new Headers({ location: url }),
            cookies: {
              set: jest.fn(),
              get: jest.fn(),
              delete: jest.fn(),
            },
          };
        }),
      },
    };
  });
}
