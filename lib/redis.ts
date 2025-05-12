import Redis from 'ioredis';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import pino from 'pino';

let redis: Redis | null = null;
let initialConnectionAttempted = false;
let initialConnectionFailed = false;
let redisExplicitlyDisabled = false;

const moduleLogger = logger.child({ module: 'redis-client' });

// --- BEGIN NEW HELPER for Redis Retry Strategy ---
function _createRedisRetryStrategy(
  localLogger: pino.Logger,
  redisUrl: string | undefined // Pass env.REDIS_URL to avoid direct env dependency here
): (times: number) => number | null {
  return function retryStrategy(times: number): number | null {
    if (times > 5) {
      localLogger.error(
        `Redis: Could not connect after ${times} attempts. Stopping retries. Please check Redis server and REDIS_URL: ${redisUrl}`
      );
      initialConnectionFailed = true; // This global flag modification is a side effect
      return null;
    }
    const delay = Math.min(times * 200, 3000);
    localLogger.warn(
      `Redis: Connection attempt ${times} failed for ${redisUrl}. Retrying in ${delay}ms...`
    );
    return delay;
  };
}
// --- END NEW HELPER for Redis Retry Strategy ---

// --- BEGIN NEW HELPER for attaching Redis event listeners ---
function _attachRedisEventListeners(client: Redis): void {
  // Note: The original event handlers (_logRedisConnect etc.) use `moduleLogger` from their outer scope.
  client.on('connect', _logRedisConnect);
  client.on('error', _logRedisError);
  client.on('close', _logRedisClose);
  client.on('reconnecting', _logRedisReconnecting);
}
// --- END NEW HELPER for attaching Redis event listeners ---

// --- BEGIN NEW HELPER for attempting Redis client instantiation ---
function _attemptRedisClientInstantiation(
  redisUrlToUse: string,
  baseLogger: pino.Logger // For retry strategy and initial logging
): void {
  // This function modifies global `redis` and `initialConnectionFailed`
  baseLogger.info(
    { redisUrl: redisUrlToUse },
    'REDIS_URL is set. Attempting to initialize Redis client...'
  );

  try {
    const client = new Redis(redisUrlToUse, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
      retryStrategy: _createRedisRetryStrategy(baseLogger, redisUrlToUse),
    });

    _attachRedisEventListeners(client);
    redis = client; // Set global redis instance

    if (redis.status !== 'connecting' && redis.status !== 'ready' && redis.status !== 'connect') {
      baseLogger.warn(
        { currentStatus: redis.status, redisUrl: redisUrlToUse },
        "Redis client instantiated, but initial status is not 'connecting' or 'ready'. " +
          'This may indicate an immediate issue with Redis server or configuration. ' +
          'Redis-dependent features will likely be unavailable or fail open.'
      );
      initialConnectionFailed = true;
    } else {
      baseLogger.info(
        { currentStatus: redis.status, redisUrl: redisUrlToUse },
        'Redis client instance created, attempting connection...'
      );
      // initialConnectionFailed remains false or will be set by error/retry handlers
    }
  } catch (synchronousError) {
    baseLogger.error(
      { error: synchronousError, redisUrl: redisUrlToUse },
      'CRITICAL: Synchronous error during Redis client instantiation. Redis will be unavailable.'
    );
    initialConnectionFailed = true;
    redis = null; // Ensure redis is null on critical instantiation failure
  }
}
// --- END NEW HELPER ---

// --- BEGIN NEW HELPER for handling missing REDIS_URL ---
function _handleNoRedisUrl(baseLogger: pino.Logger): null {
  baseLogger.info(
    'REDIS_URL is not set in environment variables. Redis-dependent features (e.g., rate limiting) will be disabled. ' +
      'This is expected if you do not intend to use Redis. To enable Redis features, please set REDIS_URL.'
  );
  initialConnectionFailed = true; // Mark as failed because it's not configured
  redisExplicitlyDisabled = true; // Prevent further attempts for this session
  redis = null; // Ensure redis instance is null
  return null;
}
// --- END NEW HELPER for handling missing REDIS_URL ---

/**
 * Initializes and returns a singleton ioredis client instance if REDIS_URL is configured.
 * Includes connection logic, error handling, and retry strategy.
 * Logs informative messages if Redis is not configured or if connection fails.
 * @returns {Redis | null} The ioredis client instance if configured and connection is attempted, otherwise null.
 */
// eslint-disable-next-line complexity
function getRedisClient(): Redis | null {
  // Return type can now be null
  if (redisExplicitlyDisabled) {
    return null; // If already determined to be disabled, don't try again
  }
  if (initialConnectionAttempted && redis) {
    // If we already have an instance (even if it failed to connect initially),
    // return it and let retry/error handlers manage it.
    // initialConnectionFailed flag will be checked by getOptionalRedisClient.
    return redis;
  }
  if (initialConnectionAttempted && !redis) {
    // This means REDIS_URL was missing on a previous attempt and redis was never instantiated.
    return null;
  }

  initialConnectionAttempted = true;

  if (!env.REDIS_URL) {
    // Logic extracted to _handleNoRedisUrl
    return _handleNoRedisUrl(logger);
  }

  // If REDIS_URL is set, proceed with connection attempt
  // Extracted to _attemptRedisClientInstantiation
  _attemptRedisClientInstantiation(env.REDIS_URL, logger);

  if (initialConnectionFailed && redis) {
    logger.warn(
      { status: redis.status, redisUrl: env.REDIS_URL },
      'getRedisClient: Returning a Redis client instance that has previously indicated connection issues or is in a non-operational state. Redis features may be impaired.'
    );
  } else if (redis && !initialConnectionFailed) {
    // logger.debug("getRedisClient: Returning apparently healthy Redis client instance.");
  }

  return redis; // This can be null if REDIS_URL was not set or if synchronousError occurred
}

/**
 * Singleton ioredis client instance or null if not configured/failed.
 * Exporting this directly causes getRedisClient() to be called upon module import,
 * facilitating early connection attempts and logging (if REDIS_URL is set).
 */
export const redisClient = getRedisClient();

/**
 * Attempts to get a usable Redis client.
 * Returns null if Redis is not configured (REDIS_URL not set),
 * if the initial connection attempt failed definitively, or if the client is not in a usable state.
 * This is the preferred way for features to obtain a Redis client if they can fail gracefully.
 *
 * @returns {Redis | null} The ioredis client instance or null.
 */
export function getOptionalRedisClient(): Redis | null {
  // Ensure getRedisClient() has been called by accessing the exported redisClient
  // This initializes `redis`, `initialConnectionFailed`, `redisExplicitlyDisabled`
  const client = redisClient; // This is just to trigger the getter if not already run.

  if (redisExplicitlyDisabled) {
    // True if REDIS_URL was not set
    // Informative log already happened in getRedisClient
    return null;
  }

  if (initialConnectionFailed) {
    logger.warn(
      { redisUrl: env.REDIS_URL, status: client?.status }, // client might be null if sync error in getRedisClient
      'getOptionalRedisClient: Initial Redis connection attempt failed or client is in an error state. Returning null.'
    );
    return null;
  }

  if (!client) {
    // Should be caught by redisExplicitlyDisabled or initialConnectionFailed if REDIS_URL was missing/bad
    logger.warn(
      'getOptionalRedisClient: Redis client instance is unexpectedly null. Redis is unavailable. Returning null.'
    );
    return null;
  }

  // Final check on current status before returning a client instance
  if (client.status !== 'ready' && client.status !== 'connecting' && client.status !== 'connect') {
    logger.warn(
      { currentStatus: client.status, redisUrl: env.REDIS_URL },
      'getOptionalRedisClient: Redis client is not in a ready/connecting state. Returning null to ensure fail-open.'
    );
    return null;
  }

  return client;
}

// Helper functions for logging Redis events to reduce complexity in getRedisClient
function _logRedisConnect(this: Redis) {
  moduleLogger.info(
    { host: this.options.host, port: this.options.port },
    'Successfully connected to Redis.'
  );
  initialConnectionFailed = false; // Reset on successful connection
}

function _logRedisError(this: Redis, err: Error) {
  moduleLogger.error(
    {
      error: {
        message: err.message,
        name: err.name,
        stack: err.stack,
      },
      host: this.options.host,
      port: this.options.port,
    },
    'Redis client connection error.'
  );
  if (!initialConnectionAttempted) {
    initialConnectionFailed = true;
  }
}

function _logRedisClose(this: Redis) {
  moduleLogger.warn(
    { host: this.options.host, port: this.options.port },
    'Redis client connection closed.'
  );
}

function _logRedisReconnecting(this: Redis) {
  moduleLogger.info(
    { host: this.options.host, port: this.options.port },
    'Redis client attempting to reconnect...'
  );
}
