import Redis from 'ioredis';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import pino from 'pino';

declare const module: {
  hot?: {
    dispose: (callback: (data: Record<string, unknown>) => Promise<void> | void) => void;
    data?: Record<string, unknown>;
  };
}; // For HMR module.hot API

// --- BEGIN Global Symbol for Singleton ---
interface RedisGlobal {
  redisClient?: Redis | null;
  redisConnectionAttempted?: boolean;
  redisConnectionFailed?: boolean;
  redisExplicitlyDisabled?: boolean;
}

const REDIS_GLOBAL_KEY = Symbol.for('__NEXT_REDIS_CLIENT_SINGLETON__');

function getRedisGlobal(): RedisGlobal {
  const globalWithRedis = globalThis as typeof globalThis & {
    [REDIS_GLOBAL_KEY]?: RedisGlobal;
  };
  if (!globalWithRedis[REDIS_GLOBAL_KEY]) {
    globalWithRedis[REDIS_GLOBAL_KEY] = {
      redisClient: undefined, // Initialize as undefined to distinguish from null (explicitly no client)
      redisConnectionAttempted: false,
      redisConnectionFailed: false,
      redisExplicitlyDisabled: false,
    };
  }
  return globalWithRedis[REDIS_GLOBAL_KEY] as RedisGlobal;
}
// --- END Global Symbol for Singleton ---

const moduleLogger = logger.child({ module: 'redis-client' });

// --- BEGIN NEW HELPER for Redis Retry Strategy ---
function _createRedisRetryStrategy(
  localLogger: pino.Logger,
  redisUrl: string | undefined // Pass env.REDIS_URL to avoid direct env dependency here
): (times: number) => number | null {
  return function retryStrategy(times: number): number | null {
    const redisGlobal = getRedisGlobal();
    if (times > 5) {
      localLogger.error(
        `Redis: Could not connect after ${times} attempts. Stopping retries. Please check Redis server and REDIS_URL: ${redisUrl}`
      );
      redisGlobal.redisConnectionFailed = true; // This global flag modification is a side effect
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

  // Detach any existing listeners from this specific client instance first to prevent duplicates
  // if this function were ever called multiple times on the same client (defensive)
  client.removeAllListeners('connect');
  client.removeAllListeners('error');
  client.removeAllListeners('close');
  client.removeAllListeners('reconnecting');

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
  const redisGlobal = getRedisGlobal();
  // This function modifies global `redisGlobal.redisClient` and `redisGlobal.redisConnectionFailed`
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
    redisGlobal.redisClient = client; // Set global redis instance

    if (
      redisGlobal.redisClient.status !== 'connecting' &&
      redisGlobal.redisClient.status !== 'ready' &&
      redisGlobal.redisClient.status !== 'connect'
    ) {
      baseLogger.warn(
        { currentStatus: redisGlobal.redisClient?.status ?? 'unknown', redisUrl: redisUrlToUse },
        "Redis client instantiated, but initial status is not 'connecting' or 'ready'. " +
          'This may indicate an immediate issue with Redis server or configuration. ' +
          'Redis-dependent features will likely be unavailable or fail open.'
      );
      redisGlobal.redisConnectionFailed = true;
    } else {
      baseLogger.info(
        { currentStatus: redisGlobal.redisClient?.status ?? 'unknown', redisUrl: redisUrlToUse },
        'Redis client instance created, attempting connection...'
      );
      // redisGlobal.redisConnectionFailed remains false or will be set by error/retry handlers
    }
  } catch (synchronousError) {
    baseLogger.error(
      { error: synchronousError, redisUrl: redisUrlToUse },
      'CRITICAL: Synchronous error during Redis client instantiation. Redis will be unavailable.'
    );
    redisGlobal.redisConnectionFailed = true;
    redisGlobal.redisClient = null; // Ensure redis is null on critical instantiation failure
  }
}
// --- END NEW HELPER ---

// --- BEGIN NEW HELPER for handling missing REDIS_URL ---
function _handleNoRedisUrl(baseLogger: pino.Logger): null {
  const redisGlobal = getRedisGlobal();
  baseLogger.info(
    'REDIS_URL is not set in environment variables. Redis-dependent features (e.g., rate limiting) will be disabled. ' +
      'This is expected if you do not intend to use Redis. To enable Redis features, please set REDIS_URL.'
  );
  redisGlobal.redisConnectionFailed = true; // Mark as failed because it's not configured
  redisGlobal.redisExplicitlyDisabled = true; // Prevent further attempts for this session
  redisGlobal.redisClient = null; // Ensure redis instance is null
  return null;
}
// --- END NEW HELPER for handling missing REDIS_URL ---

/**
 * Initializes and returns a singleton ioredis client instance if REDIS_URL is configured.
 * Includes connection logic, error handling, and retry strategy.
 * Logs informative messages if Redis is not configured or if connection fails.
 * @returns {Redis | null} The ioredis client instance if configured and connection is attempted, otherwise null.
 */

function getRedisClient(): Redis | null {
  const redisGlobal = getRedisGlobal();

  // Return type can now be null
  if (redisGlobal.redisExplicitlyDisabled) {
    return null; // If already determined to be disabled, don't try again
  }

  // If an instance already exists on the global scope (even if it failed to connect initially),
  // return it. Retry/error handlers attached to it should manage its state.
  // The redisGlobal.redisClient is initialized to `undefined` to distinguish from `null` (explicitly no client).
  if (typeof redisGlobal.redisClient !== 'undefined') {
    return redisGlobal.redisClient;
  }

  if (redisGlobal.redisConnectionAttempted && !redisGlobal.redisClient) {
    // This means REDIS_URL was missing on a previous attempt or instantiation failed,
    // and redisGlobal.redisClient was set to null.
    return null;
  }

  redisGlobal.redisConnectionAttempted = true;

  if (!env.REDIS_URL) {
    // Logic extracted to _handleNoRedisUrl
    return _handleNoRedisUrl(logger);
  }

  // If REDIS_URL is set, proceed with connection attempt
  // Extracted to _attemptRedisClientInstantiation
  _attemptRedisClientInstantiation(env.REDIS_URL, logger);

  if (redisGlobal.redisConnectionFailed && redisGlobal.redisClient) {
    logger.warn(
      { status: (redisGlobal.redisClient as Redis)?.status ?? 'unknown', redisUrl: env.REDIS_URL },
      'getRedisClient: Returning a Redis client instance that has previously indicated connection issues or is in a non-operational state. Redis features may be impaired.'
    );
  } else if (redisGlobal.redisClient && !redisGlobal.redisConnectionFailed) {
    // logger.debug("getRedisClient: Returning apparently healthy Redis client instance.");
  }

  return redisGlobal.redisClient === undefined ? null : redisGlobal.redisClient;
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
  const currentClient = getRedisClient();
  const globalState = getRedisGlobal();

  if (globalState.redisExplicitlyDisabled) {
    return null;
  }

  if (globalState.redisConnectionFailed) {
    const statusDetail =
      currentClient instanceof Redis ? currentClient.status : 'unknown (client was null)';
    logger.warn(
      { redisUrl: env.REDIS_URL, status: statusDetail },
      'getOptionalRedisClient: Initial Redis connection attempt failed or client is in an error state. Returning null.'
    );
    return null;
  }

  if (!currentClient) {
    logger.warn(
      'getOptionalRedisClient: Redis client instance is unexpectedly null (and connection not marked as globally failed). Redis is unavailable. Returning null.'
    );
    return null;
  }

  if (
    currentClient.status !== 'ready' &&
    currentClient.status !== 'connecting' &&
    currentClient.status !== 'connect'
  ) {
    logger.warn(
      { currentStatus: currentClient.status, redisUrl: env.REDIS_URL },
      'getOptionalRedisClient: Redis client is not in a ready/connecting state (though not marked as globally failed). Returning null to ensure fail-open.'
    );
    return null;
  }

  return currentClient;
}

// Helper functions for logging Redis events to reduce complexity in getRedisClient
function _logRedisConnect(this: Redis) {
  const redisGlobal = getRedisGlobal();
  moduleLogger.info(
    { host: this.options.host, port: this.options.port },
    'Successfully connected to Redis.'
  );
  redisGlobal.redisConnectionFailed = false; // Reset on successful connection
}

function _logRedisError(this: Redis, err: Error) {
  const redisGlobal = getRedisGlobal();
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
  // Mark as failed only if this is part of the initial attempt.
  // If it's an error after initial connection, redisConnectionFailed might already be false.
  // The retry strategy also sets redisConnectionFailed to true after max retries.
  const clientStatus = redisGlobal.redisClient?.status;
  if (
    !redisGlobal.redisConnectionAttempted ||
    clientStatus === 'reconnecting' ||
    clientStatus === 'connecting'
  ) {
    redisGlobal.redisConnectionFailed = true;
  }
}

function _logRedisClose(this: Redis) {
  // const redisGlobal = getRedisGlobal(); // Unused
  moduleLogger.warn(
    { host: this.options.host, port: this.options.port },
    'Redis client connection closed.'
  );
}

function _logRedisReconnecting(this: Redis) {
  // const redisGlobal = getRedisGlobal(); // Unused
  moduleLogger.info(
    { host: this.options.host, port: this.options.port },
    'Redis client attempting to reconnect...'
  );
}

// --- HMR Cleanup ---
// Ensure this code only runs in a Node.js environment where `module` and `module.hot` are defined.
if (typeof module !== 'undefined' && module.hot && process.env.NODE_ENV === 'development') {
  module.hot.dispose(async (_data: Record<string, unknown>) => {
    const redisGlobal = getRedisGlobal();
    if (redisGlobal.redisClient) {
      moduleLogger.info('HMR: Disposing old Redis client...');
      try {
        // Detach listeners before quitting to be absolutely sure, though quit should handle it.
        redisGlobal.redisClient.removeAllListeners();
        await redisGlobal.redisClient.quit();
        moduleLogger.info('HMR: Old Redis client quit successfully.');
      } catch (err) {
        moduleLogger.error({ error: err }, 'HMR: Error quitting old Redis client.');
      }
    }
    // Clear the global instance so it gets fully re-initialized by the new module instance
    const globalWithRedis = globalThis as typeof globalThis & { [REDIS_GLOBAL_KEY]?: RedisGlobal };
    delete globalWithRedis[REDIS_GLOBAL_KEY];
    moduleLogger.info('HMR: Redis global symbol cleared for re-initialization.');
    // You can pass data to the new module instance if needed via data object
    // _data.reloaded = true;
  });
}
