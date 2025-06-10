import { CacheService } from '@/lib/services/cache.service';
import { getOptionalRedisClient } from '@/lib/redis';

// Mock dependencies
jest.mock('@/lib/redis');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

const mockGetOptionalRedisClient = getOptionalRedisClient as jest.MockedFunction<
  typeof getOptionalRedisClient
>;

interface TestData {
  id: number;
  name: string;
  active: boolean;
}

describe('CacheService', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock Redis client for each test
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      mget: jest.fn(),
      pipeline: jest.fn(),
      dbsize: jest.fn(),
      info: jest.fn(),
      flushdb: jest.fn(),
    };
  });

  describe('get', () => {
    it('should return cache miss when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.get('test:key');

      expect(result).toEqual({ value: null, hit: false });
    });

    it('should return cache miss when key does not exist', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.get.mockResolvedValue(null);

      const result = await CacheService.get('test:key');

      expect(result).toEqual({ value: null, hit: false });
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
    });

    it('should return cached value when key exists', async () => {
      const testData: TestData = { id: 1, name: 'Test', active: true };
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await CacheService.get<TestData>('test:key');

      expect(result).toEqual({ value: testData, hit: true });
    });

    it('should handle Redis errors gracefully', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.get.mockRejectedValue(new Error('Connection timeout'));

      const result = await CacheService.get('test:key');

      expect(result).toEqual({
        value: null,
        hit: false,
        error: 'Connection timeout',
      });
    });

    it('should handle JSON parsing errors', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.get.mockResolvedValue('invalid json{');

      const result = await CacheService.get('test:key');

      expect(result).toEqual({
        value: null,
        hit: false,
        error: 'Failed to deserialize cached value',
      });
    });
  });

  describe('set', () => {
    it('should return false when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.set('test:key', { data: 'test' });

      expect(result).toBe(false);
    });

    it('should set value with default TTL', async () => {
      const testData: TestData = { id: 1, name: 'Test', active: true };
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await CacheService.set('test:key', testData);

      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test:key',
        3600, // default TTL
        JSON.stringify(testData)
      );
    });

    it('should set value with custom TTL', async () => {
      const testData: TestData = { id: 1, name: 'Test', active: true };
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await CacheService.set('test:key', testData, { ttl: 1800 });

      expect(result).toBe(true);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test:key',
        1800,
        JSON.stringify(testData)
      );
    });

    it('should set value without TTL when ttl is 0', async () => {
      const testData: TestData = { id: 1, name: 'Test', active: true };
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await CacheService.set('test:key', testData, { ttl: 0 });

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith('test:key', JSON.stringify(testData));
    });

    it('should handle Redis errors gracefully', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.setex.mockRejectedValue(new Error('Memory limit exceeded'));

      const result = await CacheService.set('test:key', { data: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should return false when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.delete('test:key');

      expect(result).toBe(false);
    });

    it('should return true when key is deleted', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.del.mockResolvedValue(1);

      const result = await CacheService.delete('test:key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
    });

    it('should return false when key does not exist', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.del.mockResolvedValue(0);

      const result = await CacheService.delete('test:key');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return false when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.exists('test:key');

      expect(result).toBe(false);
    });

    it('should return true when key exists', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await CacheService.exists('test:key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await CacheService.exists('test:key');

      expect(result).toBe(false);
    });
  });

  describe('setMany', () => {
    it('should return 0 when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const entries = [
        { key: 'key1', value: { id: 1 } },
        { key: 'key2', value: { id: 2 } },
      ];

      const result = await CacheService.setMany(entries);

      expect(result).toBe(0);
    });

    it('should return 0 for empty entries array', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);

      const result = await CacheService.setMany([]);

      expect(result).toBe(0);
    });

    it('should set multiple values using pipeline', async () => {
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [null, 'OK'],
        ]),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.pipeline.mockReturnValue(mockPipeline);

      const entries = [
        { key: 'key1', value: { id: 1 }, options: { ttl: 1800 } },
        { key: 'key2', value: { id: 2 } }, // Uses default TTL
      ];

      const result = await CacheService.setMany(entries);

      expect(result).toBe(2);
      expect(mockPipeline.setex).toHaveBeenCalledWith('key1', 1800, '{"id":1}');
      expect(mockPipeline.setex).toHaveBeenCalledWith('key2', 3600, '{"id":2}');
    });

    it('should handle partial failures in pipeline', async () => {
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [new Error('Memory limit'), null],
        ]),
      };

      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.pipeline.mockReturnValue(mockPipeline);

      const entries = [
        { key: 'key1', value: { id: 1 } },
        { key: 'key2', value: { id: 2 } },
      ];

      const result = await CacheService.setMany(entries);

      expect(result).toBe(1); // Only one succeeded
    });
  });

  describe('getMany', () => {
    it('should return cache misses when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const keys = ['key1', 'key2'];
      const result = await CacheService.getMany<TestData>(keys);

      expect(result).toEqual([
        { key: 'key1', result: { value: null, hit: false } },
        { key: 'key2', result: { value: null, hit: false } },
      ]);
    });

    it('should return empty array for empty keys', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);

      const result = await CacheService.getMany([]);

      expect(result).toEqual([]);
    });

    it('should get multiple values', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.mget.mockResolvedValue([
        '{"id":1,"name":"Test1","active":true}',
        null,
        '{"id":3,"name":"Test3","active":false}',
      ]);

      const keys = ['key1', 'key2', 'key3'];
      const result = await CacheService.getMany<TestData>(keys);

      expect(result).toEqual([
        {
          key: 'key1',
          result: {
            value: { id: 1, name: 'Test1', active: true },
            hit: true,
          },
        },
        { key: 'key2', result: { value: null, hit: false } },
        {
          key: 'key3',
          result: {
            value: { id: 3, name: 'Test3', active: false },
            hit: true,
          },
        },
      ]);
      expect(mockRedisClient.mget).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should handle parsing errors for individual values', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.mget.mockResolvedValue([
        '{"id":1,"name":"Test1","active":true}',
        'invalid json{',
      ]);

      const keys = ['key1', 'key2'];
      const result = await CacheService.getMany<TestData>(keys);

      expect(result).toEqual([
        {
          key: 'key1',
          result: {
            value: { id: 1, name: 'Test1', active: true },
            hit: true,
          },
        },
        { key: 'key2', result: { value: null, hit: false, error: 'Parse error' } },
      ]);
    });
  });

  describe('deleteMany', () => {
    it('should return 0 when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.deleteMany(['key1', 'key2']);

      expect(result).toBe(0);
    });

    it('should return 0 for empty keys array', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);

      const result = await CacheService.deleteMany([]);

      expect(result).toBe(0);
    });

    it('should delete multiple keys', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await CacheService.deleteMany(['key1', 'key2']);

      expect(result).toBe(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });

  describe('getStats', () => {
    it('should return disconnected when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.getStats();

      expect(result).toEqual({ connected: false });
    });

    it('should return cache statistics', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.dbsize.mockResolvedValue(150);
      mockRedisClient.info.mockResolvedValue('used_memory_human:2.5M\nother_info:value\n');

      const result = await CacheService.getStats();

      expect(result).toEqual({
        connected: true,
        keyCount: 150,
        memory: '2.5M',
      });
    });

    it('should handle info command errors', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.dbsize.mockRejectedValue(new Error('Connection error'));

      const result = await CacheService.getStats();

      expect(result).toEqual({ connected: false });
    });
  });

  describe('clear', () => {
    it('should return false when Redis is not available', async () => {
      mockGetOptionalRedisClient.mockReturnValue(null);

      const result = await CacheService.clear();

      expect(result).toBe(false);
    });

    it('should clear all cache', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.flushdb.mockResolvedValue('OK');

      const result = await CacheService.clear();

      expect(result).toBe(true);
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });

    it('should handle clear errors', async () => {
      mockGetOptionalRedisClient.mockReturnValue(mockRedisClient);
      mockRedisClient.flushdb.mockRejectedValue(new Error('Permission denied'));

      const result = await CacheService.clear();

      expect(result).toBe(false);
    });
  });
});
