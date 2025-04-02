// Ensure Request is defined before anything else
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
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

// Mock Headers if not defined
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
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

// Mock Response if not defined
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers || {});
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
  };
}

// Import Next.js server after mocking Request and Response
jest.mock('next/server', () => {
  return {
    NextRequest: class NextRequest extends global.Request {
      constructor(input, init = {}) {
        super(input, init);
        this.nextUrl = new URL(typeof input === 'string' ? input : input.url, 'http://localhost');
      }
    },
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

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
