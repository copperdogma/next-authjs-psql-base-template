/**
 * Browser API mock factories for testing
 * Consolidated into a single file for simplicity
 */

/**
 * Create Headers class constructor
 */
export function createHeadersClass() {
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
 * Create Request class constructor
 */
export function createRequestClass() {
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
 * Create Response class constructor
 */
export function createResponseClass(appUrl) {
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
 * Create URL class constructor
 */
export function createURLClass() {
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

// For backward compatibility, provide aliases for the inline functions
export { createHeadersClass as createHeadersClassInline };
export { createRequestClass as createRequestClassInline };
export { createResponseClass as createResponseClassInline };
export { createURLClass as createURLClassInline };
