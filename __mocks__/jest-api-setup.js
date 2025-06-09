/**
 * Setup for Jest API mocks
 * This file initializes all the mock API classes needed for testing
 */
import {
  createRequestMock,
  createHeadersMock,
  createResponseMock,
  createNextRequestMock,
  createNextResponseMock,
} from '../../jest.setup.api';

/**
 * Initialize all global API mocks and Next.js server mocks
 */
export function createJestApiSetup() {
  // Set up global objects if not defined
  if (typeof global.Request === 'undefined') {
    global.Request = createRequestMock();
  }

  if (typeof global.Headers === 'undefined') {
    global.Headers = createHeadersMock();
  }

  if (typeof global.Response === 'undefined') {
    global.Response = createResponseMock();
  }

  // Import Next.js server after setting up the API classes
  jest.mock('next/server', () => {
    return {
      NextRequest: createNextRequestMock(),
      NextResponse: createNextResponseMock(),
    };
  });
}
