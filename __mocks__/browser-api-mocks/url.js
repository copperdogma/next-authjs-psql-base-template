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
