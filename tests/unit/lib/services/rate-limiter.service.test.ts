import { RateLimiterService } from '@/lib/services/rate-limiter.service';
import { getOptionalRedisClient } from '@/lib/redis';
import { env } from '@/lib/env';

// Mock dependencies
jest.mock('@/lib/redis');
jest.mock('@/lib/env');
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    })),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockGetOptionalRedisClient = getOptionalRedisClient as jest.MockedFunction<
  typeof getOptionalRedisClient
>;

const mockEnv = env as jest.Mocked<typeof env>;

describe('RateLimiterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default env values
    mockEnv.RATE_LIMIT_REGISTER_MAX_ATTEMPTS = 10;
    mockEnv.RATE_LIMIT_REGISTER_WINDOW_SECONDS = 3600;
  });

  describe('check method', () => {
    it('should return not limited with no error when Redis client is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: false });
    });

    it('should return not limited when current attempts are below the limit', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 5], // INCR result: 5 attempts
          [null, 'OK'], // EXPIRE result
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: false });
      expect(mockPipeline.incr).toHaveBeenCalledWith('rate-limit:test:127.0.0.1');
      expect(mockPipeline.expire).toHaveBeenCalledWith('rate-limit:test:127.0.0.1', 3600);
    });

    it('should return limited when current attempts exceed the limit', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 15], // INCR result: 15 attempts (exceeds limit of 10)
          [null, 'OK'], // EXPIRE result
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: true, error: false });
    });

    it('should return error true when pipeline execution returns null', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: true });
    });

    it('should return error true when INCR command returns an error', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [new Error('Redis INCR error'), null], // INCR error
          [null, 'OK'], // EXPIRE result
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: true });
    });

    it('should return error true when EXPIRE command returns an error', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 5], // INCR result
          [new Error('Redis EXPIRE error'), null], // EXPIRE error
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: true });
    });

    it('should return error true when INCR returns invalid data type', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'invalid'], // INCR result: invalid type
          [null, 'OK'], // EXPIRE result
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: true });
    });

    it('should return error true when pipeline execution throws an exception', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Connection error')),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      const result = await RateLimiterService.check('test:127.0.0.1');

      expect(result).toEqual({ limited: false, error: true });
    });

    it('should use correct Redis key format', async () => {
      const mockPipeline = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 5],
          [null, 'OK'],
        ]),
      };

      const mockRedisClient = {
        pipeline: jest.fn().mockReturnValue(mockPipeline),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient as any);

      await RateLimiterService.check('register:127.0.0.1');

      expect(mockPipeline.incr).toHaveBeenCalledWith('rate-limit:register:127.0.0.1');
      expect(mockPipeline.expire).toHaveBeenCalledWith('rate-limit:register:127.0.0.1', 3600);
    });
  });
});
