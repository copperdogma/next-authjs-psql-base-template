import pino from 'pino';

// Create a mock logger that matches pino.Logger type
export const mockPinoLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
  level: 'info',
  silent: jest.fn(),
  bindings: jest.fn(),
  flush: jest.fn(),
  isLevelEnabled: jest.fn(),
  levelVal: 30,
  levels: {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10,
    },
    labels: {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal',
    },
  },
} as unknown as pino.Logger;

export const setupMathRandomMock = () => {
  const originalRandom = Math.random;

  beforeAll(() => {
    Math.random = jest.fn().mockReturnValue(0.1);
  });

  afterAll(() => {
    Math.random = originalRandom;
  });

  return () => Math.random as jest.Mock;
};

export const createMockLogger = () => ({
  ...mockPinoLogger,
  child: jest.fn().mockReturnValue(mockPinoLogger),
});

// Reset all mocks between tests
export const resetMocks = () => {
  jest.clearAllMocks();
  Object.values(mockPinoLogger).forEach(mock => {
    if (typeof mock === 'function') {
      (mock as jest.Mock).mockClear();
    }
  });
};
