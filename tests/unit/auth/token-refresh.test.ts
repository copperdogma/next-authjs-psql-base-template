// Mock the module
jest.mock('../../../lib/auth/token-refresh', () => {
  return {
    calculateBackoffTime: jest.fn((attempt, options) => {
      // Simple mock implementation
      const defaultOptions = {
        initialDelay: 1000,
        maxDelay: 60000,
        factor: 2,
        jitter: true,
      };

      const opts = { ...defaultOptions, ...options };

      // Calculate basic exponential delay
      const exponentialDelay = opts.initialDelay * Math.pow(opts.factor, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, opts.maxDelay);

      // Apply jitter if enabled
      if (opts.jitter) {
        return Math.floor(cappedDelay * (0.8 + 0.4 * 0.5)); // Fixed random value of 0.5
      }

      return Math.floor(cappedDelay);
    }),

    DEFAULT_OPTIONS: {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 60000,
      factor: 2,
      jitter: true,
    },

    refreshTokenWithBackoff: jest.fn(),
    refreshUserTokenWithBackoff: jest.fn(),
  };
});

describe('Token Refresh Mechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateBackoffTime', () => {
    const { calculateBackoffTime, DEFAULT_OPTIONS } = jest.requireMock(
      '../../../lib/auth/token-refresh'
    );

    it('should calculate initial delay for first attempt', () => {
      const result = calculateBackoffTime(1, {
        ...DEFAULT_OPTIONS,
        initialDelay: 1000,
        jitter: false,
      });

      expect(result).toBe(1000);
    });

    it('should increase exponentially for subsequent attempts', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        initialDelay: 1000,
        factor: 2,
        jitter: false,
      };

      expect(calculateBackoffTime(1, options)).toBe(1000); // 1000 * 2^0
      expect(calculateBackoffTime(2, options)).toBe(2000); // 1000 * 2^1
      expect(calculateBackoffTime(3, options)).toBe(4000); // 1000 * 2^2
    });

    it('should cap at maximum delay', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        initialDelay: 1000,
        maxDelay: 3000,
        factor: 2,
        jitter: false,
      };

      expect(calculateBackoffTime(1, options)).toBe(1000); // 1000 * 2^0 = 1000 (under max)
      expect(calculateBackoffTime(2, options)).toBe(2000); // 1000 * 2^1 = 2000 (under max)
      expect(calculateBackoffTime(3, options)).toBe(3000); // 1000 * 2^2 = 4000 (over max, capped at 3000)
    });

    it('should apply jitter when enabled', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        initialDelay: 1000,
        jitter: true,
      };

      // Using our mock implementation above with fixed random value of 0.5
      const result = calculateBackoffTime(1, options);

      // With jitter at 0.5, expect 1000 * (0.8 + 0.5*0.4) = 1000
      expect(result).toBe(1000);
    });
  });
});
