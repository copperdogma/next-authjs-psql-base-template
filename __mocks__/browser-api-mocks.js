/**
 * Re-export all browser API mock factories from individual files
 */
import { createHeadersClass } from './browser-api-mocks/headers';
import { createRequestClass } from './browser-api-mocks/request';
import { createResponseClass } from './browser-api-mocks/response';
import { createURLClass } from './browser-api-mocks/url';

export { createHeadersClass, createRequestClass, createResponseClass, createURLClass };

/**
 * Factory functions that create browser API mock classes
 * Each function is exported separately to avoid having multiple classes in one file
 */

/**
 * Create Response class constructor (inline implementation)
 * This maintains compatibility with code that imports directly from this file
 */
export function createResponseClassInline(appUrl) {
  return class Response {
    constructor(body, init) {
      this.body = body;
      this.init = init;
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Headers(init?.headers);
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }

    get statusText() {
      return this.init?.statusText || '';
    }

    get type() {
      return 'basic';
    }

    get url() {
      return appUrl;
    }
  };
}

/**
 * Create Headers class constructor (inline implementation)
 */
export function createHeadersClassInline() {
  return class Headers {
    constructor(init) {
      this.headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    append(key, value) {
      this.headers.set(key.toLowerCase(), value);
    }

    delete(key) {
      this.headers.delete(key.toLowerCase());
    }

    get(key) {
      return this.headers.get(key.toLowerCase()) || null;
    }

    has(key) {
      return this.headers.has(key.toLowerCase());
    }

    set(key, value) {
      this.headers.set(key.toLowerCase(), value);
    }

    entries() {
      return this.headers.entries();
    }

    keys() {
      return this.headers.keys();
    }

    values() {
      return this.headers.values();
    }

    forEach(callback) {
      this.headers.forEach(callback);
    }
  };
}

/**
 * Create Request class constructor (inline implementation)
 */
export function createRequestClassInline() {
  return class Request {
    constructor(input, init) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }
  };
}

/**
 * Create URL class constructor (inline implementation)
 */
export function createURLClassInline() {
  return class URL {
    constructor(url) {
      const parsedUrl = new globalThis.URL(url);
      this.href = parsedUrl.href;
      this.pathname = parsedUrl.pathname;
      this.search = parsedUrl.search;
      this.searchParams = parsedUrl.searchParams;
      this.hash = parsedUrl.hash;
      this.host = parsedUrl.host;
      this.hostname = parsedUrl.hostname;
      this.port = parsedUrl.port;
      this.protocol = parsedUrl.protocol;
      this.origin = parsedUrl.origin;
    }
  };
}
