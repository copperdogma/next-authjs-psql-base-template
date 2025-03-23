const { TextEncoder, TextDecoder } = require('util');

// Add TextEncoder and TextDecoder to the global object
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add a mock MessageChannel if needed
global.MessageChannel = class MessageChannel {
  constructor() {
    this.port1 = {};
    this.port2 = {};
  }
};

// Add any other missing globals required for server component tests
