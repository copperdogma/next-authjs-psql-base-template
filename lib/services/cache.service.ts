import { getOptionalRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { gzipSync, gunzipSync } from 'zlib';

const log = logger.child({ service: 'CacheService' });

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large values
}

export interface CacheResult<T> {
  value: T | null;
  hit: boolean;
  error?: string;
}

class CacheServiceImpl {
  private readonly defaultTtl = 3600; // 1 hour default TTL
  private readonly compressionThreshold = 1024; // Compress if value > 1KB

  /**
   * Get a value from cache
   */
  public async get<T>(key: string): Promise<CacheResult<T>> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug({ key }, 'Redis client not available, cache miss (fail-open).');
      return { value: null, hit: false };
    }

    try {
      const rawValue = await redisClient.get(key);

      if (rawValue === null) {
        log.debug({ key }, 'Cache miss');
        return { value: null, hit: false };
      }

      const parsedValue = this.deserializeValue<T>(rawValue);
      log.debug({ key }, 'Cache hit');
      return { value: parsedValue, hit: true };
    } catch (error) {
      log.error({ key, error }, 'Error getting value from cache');
      return {
        value: null,
        hit: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set a value in cache
   */
  public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug({ key }, 'Redis client not available, skipping cache set (fail-open).');
      return false;
    }

    try {
      const serializedValue = this.serializeValue(value, options.compress);
      const ttl = options.ttl !== undefined ? options.ttl : this.defaultTtl;

      if (ttl > 0) {
        await redisClient.setex(key, ttl, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }

      log.debug({ key, ttl }, 'Value set in cache');
      return true;
    } catch (error) {
      log.error({ key, error }, 'Error setting value in cache');
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  public async delete(key: string): Promise<boolean> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug({ key }, 'Redis client not available, skipping cache delete (fail-open).');
      return false;
    }

    try {
      const result = await redisClient.del(key);
      const deleted = result > 0;
      log.debug({ key, deleted }, 'Cache delete operation completed');
      return deleted;
    } catch (error) {
      log.error({ key, error }, 'Error deleting value from cache');
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug({ key }, 'Redis client not available, assuming key does not exist (fail-open).');
      return false;
    }

    try {
      const result = await redisClient.exists(key);
      const exists = result > 0;
      log.debug({ key, exists }, 'Cache exists check completed');
      return exists;
    } catch (error) {
      log.error({ key, error }, 'Error checking if key exists in cache');
      return false;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  public async setMany<T>(
    entries: Array<{ key: string; value: T; options?: CacheOptions }>
  ): Promise<number> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug('Redis client not available, skipping cache setMany (fail-open).');
      return 0;
    }

    if (entries.length === 0) {
      return 0;
    }

    try {
      const pipeline = redisClient.pipeline();

      for (const entry of entries) {
        const serializedValue = this.serializeValue(entry.value, entry.options?.compress);
        const ttl = entry.options?.ttl !== undefined ? entry.options.ttl : this.defaultTtl;

        if (ttl > 0) {
          pipeline.setex(entry.key, ttl, serializedValue);
        } else {
          pipeline.set(entry.key, serializedValue);
        }
      }

      const results = await pipeline.exec();
      const successCount = results?.filter(([err]) => !err).length || 0;

      log.debug({ entriesCount: entries.length, successCount }, 'Bulk cache set completed');
      return successCount;
    } catch (error) {
      log.error({ entriesCount: entries.length, error }, 'Error setting multiple values in cache');
      return 0;
    }
  }

  /**
   * Get multiple values by keys
   */
  public async getMany<T>(keys: string[]): Promise<Array<{ key: string; result: CacheResult<T> }>> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug('Redis client not available, returning all cache misses (fail-open).');
      return keys.map(key => ({
        key,
        result: { value: null, hit: false },
      }));
    }

    if (keys.length === 0) {
      return [];
    }

    try {
      const values = await redisClient.mget(...keys);

      return keys.map((key, index) => {
        const rawValue = values[index];
        if (rawValue === null) {
          return {
            key,
            result: { value: null, hit: false },
          };
        }

        try {
          const parsedValue = this.deserializeValue<T>(rawValue);
          return {
            key,
            result: { value: parsedValue, hit: true },
          };
        } catch (parseError) {
          log.error({ key, parseError }, 'Error parsing cached value');
          return {
            key,
            result: { value: null, hit: false, error: 'Parse error' },
          };
        }
      });
    } catch (error) {
      log.error({ keysCount: keys.length, error }, 'Error getting multiple values from cache');
      return keys.map(key => ({
        key,
        result: {
          value: null,
          hit: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    }
  }

  /**
   * Delete multiple keys
   */
  public async deleteMany(keys: string[]): Promise<number> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug('Redis client not available, skipping cache deleteMany (fail-open).');
      return 0;
    }

    if (keys.length === 0) {
      return 0;
    }

    try {
      const result = await redisClient.del(...keys);
      log.debug({ keysCount: keys.length, deletedCount: result }, 'Bulk cache delete completed');
      return result;
    } catch (error) {
      log.error({ keysCount: keys.length, error }, 'Error deleting multiple values from cache');
      return 0;
    }
  }

  /**
   * Get cache statistics (requires Redis info command)
   */
  public async getStats(): Promise<{ connected: boolean; keyCount?: number; memory?: string }> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      return { connected: false };
    }

    try {
      const dbSize = await redisClient.dbsize();
      const info = await redisClient.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : undefined;

      return {
        connected: true,
        keyCount: dbSize,
        memory: memory,
      };
    } catch (error) {
      log.error({ error }, 'Error getting cache statistics');
      return { connected: false };
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  public async clear(): Promise<boolean> {
    const redisClient = getOptionalRedisClient();
    if (!redisClient) {
      log.debug('Redis client not available, skipping cache clear (fail-open).');
      return false;
    }

    try {
      await redisClient.flushdb();
      log.warn('Cache cleared (all keys in current database)');
      return true;
    } catch (error) {
      log.error({ error }, 'Error clearing cache');
      return false;
    }
  }

  /**
   * Serialize a value for storage with optional compression
   *
   * When compression is enabled and the serialized value exceeds the
   * compression threshold (1KB), the data is gzipped and stored with
   * a 'gzip:' prefix to indicate compression. Small values remain
   * uncompressed for efficiency.
   *
   * @param value - The value to serialize
   * @param compress - Whether to apply compression for large values
   * @returns Serialized string, optionally compressed with 'gzip:' prefix
   */
  private serializeValue<T>(value: T, compress = false): string {
    const serialized = JSON.stringify(value);

    // Compress large values if compression is enabled
    if (compress && serialized.length > this.compressionThreshold) {
      try {
        const compressed = gzipSync(Buffer.from(serialized, 'utf8'));
        const compressedString = `gzip:${compressed.toString('base64')}`;

        log.debug(
          {
            originalSize: serialized.length,
            compressedSize: compressedString.length,
            compressionRatio:
              ((1 - compressedString.length / serialized.length) * 100).toFixed(1) + '%',
          },
          'Value compressed for storage'
        );

        return compressedString;
      } catch (error) {
        log.error({ error, size: serialized.length }, 'Compression failed, storing uncompressed');
        return serialized;
      }
    }

    return serialized;
  }

  /**
   * Deserialize a value from storage with automatic decompression
   *
   * Automatically detects and decompresses values that were stored with
   * compression (indicated by 'gzip:' prefix). Handles both compressed
   * and uncompressed values transparently.
   *
   * @param serialized - The serialized string from storage
   * @returns The deserialized value
   * @throws Error if decompression or JSON parsing fails
   */
  private deserializeValue<T>(serialized: string): T {
    try {
      // Check if the value is compressed
      if (serialized.startsWith('gzip:')) {
        const compressedData = serialized.slice(5); // Remove 'gzip:' prefix
        const compressedBuffer = Buffer.from(compressedData, 'base64');
        const decompressedBuffer = gunzipSync(compressedBuffer);
        const decompressedString = decompressedBuffer.toString('utf8');

        log.debug(
          {
            compressedSize: serialized.length,
            decompressedSize: decompressedString.length,
          },
          'Value decompressed from storage'
        );

        return JSON.parse(decompressedString) as T;
      }

      // Not compressed, parse as regular JSON
      return JSON.parse(serialized) as T;
    } catch (error) {
      log.error(
        { error, serialized: serialized.substring(0, 100) },
        'Error deserializing cached value'
      );
      throw new Error('Failed to deserialize cached value');
    }
  }
}

export const CacheService = new CacheServiceImpl();
