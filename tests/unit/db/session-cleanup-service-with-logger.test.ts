/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Define our own simplified LoggerService for testing
interface LoggerService {
  info(obj: object | string, msg?: string): void;
  error(obj: object | string, msg?: string): void;
  warn(obj: object | string, msg?: string): void;
  debug(obj: object | string, msg?: string): void;
  child(bindings: Record<string, unknown>): LoggerService;
}

// Create a simple mock implementation of LoggerService that we fully control
class MockLoggerService implements LoggerService {
  public logs: { level: string; data: any; message?: string }[] = [];

  info(obj: object | string, msg?: string): void {
    this.logs.push({ level: 'info', data: obj, message: msg });
  }

  error(obj: object | string, msg?: string): void {
    this.logs.push({ level: 'error', data: obj, message: msg });
  }

  warn(obj: object | string, msg?: string): void {
    this.logs.push({ level: 'warn', data: obj, message: msg });
  }

  debug(obj: object | string, msg?: string): void {
    this.logs.push({ level: 'debug', data: obj, message: msg });
  }

  child(bindings: Record<string, unknown>): LoggerService {
    // Return self for simplicity
    return this;
  }

  // Helper method to check if a specific log was recorded
  hasLog(level: string, messageSubstring: string): boolean {
    return this.logs.some(
      log =>
        log.level === level &&
        (log.message?.includes(messageSubstring) ||
          (typeof log.data === 'string' && log.data.includes(messageSubstring)))
    );
  }

  // Clear logs between tests
  clear(): void {
    this.logs = [];
  }
}

// Import the service we want to test
import {
  SessionCleanupService,
  createSessionCleanupService,
} from '../../../lib/db/session-cleanup-service-di';

describe('Session Cleanup Service with Logger', () => {
  let service: SessionCleanupService;
  let prismaMock: DeepMockProxy<PrismaClient>;
  let mockLogger: MockLoggerService;

  // Spies for timer functions
  let setIntervalSpy: jest.Mock;
  let clearIntervalSpy: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    prismaMock = mockDeep<PrismaClient>();
    mockLogger = new MockLoggerService();

    // Mock timer functions
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(global, 'setInterval') as unknown as jest.Mock;
    clearIntervalSpy = jest.spyOn(global, 'clearInterval') as unknown as jest.Mock;

    // Create service with our mocks
    service = createSessionCleanupService(prismaMock, mockLogger);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    mockLogger.clear();
  });

  describe('cleanupExpiredSessions', () => {
    it('cleans up expired sessions with default parameters', async () => {
      // Configure the mock to return a count of deleted sessions
      prismaMock.session.deleteMany.mockResolvedValue({ count: 5 });

      // Call the function
      const result = await service.cleanupExpiredSessions({});

      // Assert expectations
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });

      // Verify result
      expect(result.count).toBe(5);

      // Verify logs were written
      expect(mockLogger.hasLog('info', 'Expired sessions cleaned successfully')).toBe(true);
    });

    it('handles errors gracefully', async () => {
      // Configure the mock to throw an error
      const testError = new Error('Database error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);

      // Call the function and expect it to throw
      await expect(service.cleanupExpiredSessions({})).rejects.toThrow('Database error');

      // Verify error was logged
      expect(mockLogger.hasLog('error', 'Failed to cleanup expired sessions')).toBe(true);
    });

    it('supports customized before date', async () => {
      // Configure the mock
      prismaMock.session.deleteMany.mockResolvedValue({ count: 3 });

      // Create a specific date
      const customDate = new Date('2023-01-01');

      // Call the function with custom date
      await service.cleanupExpiredSessions({ before: customDate });

      // Assert the query included our specific date
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: customDate,
          },
        },
      });

      // Verify logs contain success message
      expect(mockLogger.hasLog('info', 'Expired sessions cleaned successfully')).toBe(true);
    });

    it('supports user-specific cleanup', async () => {
      // Configure the mock
      prismaMock.session.deleteMany.mockResolvedValue({ count: 2 });

      // Call the function with userId
      const userId = 'test-user-123';
      await service.cleanupExpiredSessions({ userId });

      // Assert the query included our userId
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: { lt: expect.any(Date) },
          userId,
        },
      });

      // Verify logs contain success message
      expect(mockLogger.hasLog('info', 'Expired sessions cleaned successfully')).toBe(true);
    });
  });

  describe('scheduleSessionCleanup', () => {
    it('returns a cancellation function that cancels the timer', () => {
      // Mock a random interval ID
      const mockIntervalId = 123;
      setIntervalSpy.mockReturnValue(mockIntervalId);

      // Call function and get the cancel function
      const cancelFn = service.scheduleSessionCleanup({ runImmediately: false });

      // Verify the interval was set
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
      expect(mockLogger.hasLog('info', 'Session cleanup scheduled')).toBe(true);

      // Call the cancel function
      cancelFn();

      // Verify the interval was cleared
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
      expect(mockLogger.hasLog('info', 'Session cleanup schedule cancelled')).toBe(true);
    });

    it('allows custom interval configuration', () => {
      // Mock a random interval ID
      const mockIntervalId = 123;
      setIntervalSpy.mockReturnValue(mockIntervalId);

      // Create a custom interval (30 minutes)
      const intervalMs = 30 * 60 * 1000;

      // Call function with custom interval
      const cancelFn = service.scheduleSessionCleanup({
        intervalMs,
        runImmediately: false,
      });

      // Verify the interval was set with our custom value
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), intervalMs);
      expect(mockLogger.hasLog('info', 'Session cleanup scheduled')).toBe(true);

      // Call the cancel function
      cancelFn();

      // Verify the interval was cleared
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
      expect(mockLogger.hasLog('info', 'Session cleanup schedule cancelled')).toBe(true);
    });

    it('runs immediately when configured to do so', () => {
      // Configure the mock to return a positive count
      prismaMock.session.deleteMany.mockResolvedValue({ count: 5 });

      // Call with runImmediately option
      service.scheduleSessionCleanup({ runImmediately: true });

      // Verify cleanup function was called immediately
      expect(prismaMock.session.deleteMany).toHaveBeenCalled();
    });
  });
});
