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
