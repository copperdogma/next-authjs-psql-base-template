import {
  createResponseClass,
  createHeadersClass,
  createRequestClass,
  createURLClass,
} from './browser-api-mocks';

/**
 * Sets up browser API mocks for Jest tests
 * @param {string} appUrl - The application URL to use in mocks
 */
export function setupBrowserMocks(appUrl) {
  // Create class constructors from factories
  const ResponseClass = createResponseClass(appUrl);
  const HeadersClass = createHeadersClass();
  const RequestClass = createRequestClass();
  const URLClass = createURLClass();

  // Assign global properties
  global.Response = ResponseClass;
  global.Headers = HeadersClass;
  global.Request = RequestClass;
  global.URL = URLClass;
}
