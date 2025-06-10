// __mocks__/ioredis.ts

// This is a factory for the pipeline/multi mock, to ensure fresh mocks per call if needed
const createPipelineMock = () => ({
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([
    [null, 1],
    [null, 'OK'],
  ]), // Default success
  // Add other pipeline methods if your SUT uses them (e.g., get, set, etc.)
  // For now, only what was previously indicated as needed.
});

// Individual mocks for client methods, can be spied on or configured in tests
const connectMock = jest.fn().mockResolvedValue(undefined as void); // Or 'OK'
const quitMock = jest.fn().mockResolvedValue(undefined as void); // Or 'OK'
const onMock = jest.fn().mockReturnThis(); // Common for event emitters
const incrMock = jest.fn().mockResolvedValue(1);
const expireMock = jest.fn().mockResolvedValue(1);

// The actual mock class for IORedis
class MockIORedis {
  // Store options if needed for assertions or specific mock behavior
  options: Record<string, unknown> | unknown[]; // More specific than any, assuming options is an object or array
  connected: boolean = false; // Simple state tracking

  constructor(...args: unknown[]) {
    // Use unknown[] for variadic arguments
    this.options =
      args.length === 1 &&
      typeof args[0] === 'object' &&
      args[0] !== null &&
      !Array.isArray(args[0])
        ? (args[0] as Record<string, unknown>)
        : args; // Store based on typical ioredis constructor patterns
    // Immediately transition to a "connected" state for simplicity in many tests
    // unless specific tests need to control this via the connect/disconnect mocks.
    this.connected = true;
  }

  // Instance methods
  pipeline = jest.fn().mockImplementation(createPipelineMock);
  multi = jest.fn().mockImplementation(createPipelineMock); // multi usually returns a similar pipeline interface

  connect = jest.fn(async () => {
    this.connected = true;
    return connectMock();
  });

  quit = jest.fn(async () => {
    this.connected = false;
    return quitMock();
  });

  disconnect = jest.fn(() => {
    // disconnect is often synchronous
    this.connected = false;
  });

  on = onMock;
  incr = incrMock;
  expire = expireMock;

  // Expose specific internal mocks if tests need to directly manipulate or assert them
  // This is a pattern to allow tests to reach into the mock's functions
  static _mocks = {
    pipelineInstance: createPipelineMock(), // A shared instance for simple static-like access if needed by some test patterns
    connect: connectMock,
    quit: quitMock,
    on: onMock,
    incr: incrMock,
    expire: expireMock,
  };

  // Add any other ioredis instance methods your SUT might use
  // e.g., get = jest.fn().mockResolvedValue(null);
  // e.g., set = jest.fn().mockResolvedValue('OK');
  // e.g., hgetall = jest.fn().mockResolvedValue({});
}

// If ioredis is typically used as `new Redis()`, then this class is the default export.
// If ioredis is a function that returns an instance, or an object with a factory,
// the export might need to be: `export default jest.fn((...args) => new MockIORedis(...args));`
// Assuming `new Redis()` is the common usage:
export default MockIORedis;
