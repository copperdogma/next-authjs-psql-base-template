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
