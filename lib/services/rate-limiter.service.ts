import { getOptionalRedisClient } from '@/lib/redis';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'RateLimiterService' });

interface RateLimitResult {
  limited: boolean;
  error: boolean;
}

class RateLimiterServiceImpl {
  /**
   * Checks if a given key has exceeded the rate limit.
   *
   * @param key - A unique identifier for the action being rate-limited (e.g., `register:127.0.0.1`).
   * @returns A promise that resolves to an object indicating if the request is limited.
   */
  public async check(key: string): Promise<RateLimitResult> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.warn({ key }, 'Redis client not available, skipping rate limit check (fail-open).');
      return { limited: false, error: false }; // Fail open
    }

    const maxAttempts = env.RATE_LIMIT_REGISTER_MAX_ATTEMPTS;
    const windowSeconds = env.RATE_LIMIT_REGISTER_WINDOW_SECONDS;
    const redisKey = `rate-limit:${key}`;

    try {
      const pipeline = redisClient.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, windowSeconds);
      const results = await pipeline.exec();

      // Check for pipeline execution errors
      if (!results) {
        log.error({ redisKey }, 'Redis pipeline for rate limiting returned null.');
        return { limited: false, error: true }; // Fail open on error
      }

      const [[incrErr, currentAttempts], [expireErr]] = results;

      if (incrErr || expireErr) {
        log.error({ redisKey, incrErr, expireErr }, 'Error in Redis rate-limiting command.');
        return { limited: false, error: true }; // Fail open on error
      }

      if (typeof currentAttempts !== 'number') {
        log.error({ redisKey, currentAttempts }, 'Invalid result from Redis INCR command.');
        return { limited: false, error: true }; // Fail open on error
      }

      if (currentAttempts > maxAttempts) {
        log.warn({ redisKey, currentAttempts, maxAttempts }, 'Rate limit exceeded.');
        return { limited: true, error: false };
      }

      return { limited: false, error: false };
    } catch (error) {
      log.error({ redisKey, error }, 'Exception during Redis rate limit check.');
      return { limited: false, error: true }; // Fail open on error
    }
  }
}

export const RateLimiterService = new RateLimiterServiceImpl();
