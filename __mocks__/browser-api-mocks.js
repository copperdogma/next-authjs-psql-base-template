/**
 * Re-export all browser API mock factories from individual files
 * This approach ensures we don't violate the max-classes-per-file ESLint rule
 */
export { createHeadersClass } from './browser-api-mocks/headers';
export { createRequestClass } from './browser-api-mocks/request';
export { createResponseClass } from './browser-api-mocks/response';
export { createURLClass } from './browser-api-mocks/url';

// For backward compatibility, provide aliases for the inline functions
export { createHeadersClass as createHeadersClassInline } from './browser-api-mocks/headers';
export { createRequestClass as createRequestClassInline } from './browser-api-mocks/request';
export { createResponseClass as createResponseClassInline } from './browser-api-mocks/response';
export { createURLClass as createURLClassInline } from './browser-api-mocks/url';
