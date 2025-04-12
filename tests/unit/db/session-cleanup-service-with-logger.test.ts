/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  SessionCleanupService,
  createSessionCleanupService,
} from '../../../lib/db/session-cleanup-service-di';
import { LoggerService } from '../../../lib/interfaces/services';

// Create mocks for our dependencies
const mockPrismaClient = mockDeep<PrismaClient>();

// Create a type for our logger mocks
type MockedLoggerService = {
  [K in keyof Required<LoggerService>]: jest.Mock;
};

// Mock logger that implements LoggerService with required child method
const mockLogger: MockedLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn(),
};

// Mock child logger that's returned from child()
const mockChildLogger: MockedLoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn(),
};

// Create a mock createContextLogger function
const mockCreateContextLogger = jest.fn().mockImplementation(() => mockChildLogger);

// Mock the logger module with a separate variable we can access
jest.mock('../../../lib/services/logger-service', () => {
  return {
    createContextLogger: mockCreateContextLogger,
  };
});

// Import the mocked module - this is just for type checking
import { createContextLogger } from '../../../lib/services/logger-service';

describe('Session Cleanup Service with LoggerService', () => {
  let service: SessionCleanupService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  // Spies for timer functions
  let setIntervalSpy: jest.Mock;
  let clearIntervalSpy: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockReset(mockPrismaClient);
    prismaMock = mockPrismaClient;

    // Reset all mock implementations
    jest.clearAllMocks();

    // Setup child logger mock
    mockLogger.child.mockReturnValue(mockChildLogger as unknown as LoggerService);

    // Create service with injected dependencies
    service = createSessionCleanupService(prismaMock, mockLogger as unknown as LoggerService);

    // Mock timer functions
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(global, 'setInterval') as unknown as jest.Mock;
    clearIntervalSpy = jest.spyOn(global, 'clearInterval') as unknown as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('logger initialization', () => {
    it('creates a child logger when parent logger provided', () => {
      createSessionCleanupService(prismaMock, mockLogger as unknown as LoggerService);

      expect(mockLogger.child).toHaveBeenCalledWith({ component: 'db' });
    });

    it.skip('creates a default logger when no logger provided', () => {
      createSessionCleanupService(prismaMock);

      expect(mockCreateContextLogger).toHaveBeenCalledWith('db', expect.any(Object));
    });

    it.skip('uses production transport config in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });

      createSessionCleanupService(prismaMock);

      expect(mockCreateContextLogger).toHaveBeenCalledWith(
        'db',
        expect.objectContaining({
          transport: expect.objectContaining({
            target: 'pino/file',
          }),
        })
      );

      // Restore environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        configurable: true,
      });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('cleans up expired sessions with default parameters', async () => {
      // Configure the mock
      prismaMock.session.deleteMany.mockResolvedValue({ count: 5 });

      // Call the function
      await service.cleanupExpiredSessions({});

      // Assert expectations
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });

      // Verify logs were written using the child logger
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ count: 5 }),
        'Expired sessions cleaned successfully.'
      );
    });

    it('handles errors gracefully', async () => {
      const testError = new Error('Database error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);

      await expect(service.cleanupExpiredSessions({})).rejects.toThrow('Database error');

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: testError }),
        'Failed to cleanup expired sessions'
      );
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

      // Verify log contains our criteria
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 3,
          criteria: expect.objectContaining({ before: customDate }),
        }),
        'Expired sessions cleaned successfully.'
      );
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

      // Verify log contains our criteria
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 2,
          criteria: expect.objectContaining({ userId }),
        }),
        'Expired sessions cleaned successfully.'
      );
    });
  });

  describe('scheduleSessionCleanup', () => {
    it('returns a cancellation function that cancels the timer', () => {
      // Mock a random interval ID
      const mockIntervalId = 123;
      setIntervalSpy.mockReturnValue(mockIntervalId);

      // Call function and get the cancel function
      const cancelFn = service.scheduleSessionCleanup();

      // Verify the interval was set
      expect(setIntervalSpy).toHaveBeenCalled();
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ intervalMs: 24 * 60 * 60 * 1000 }),
        'Session cleanup scheduled.'
      );

      // Call the cancel function
      cancelFn();

      // Verify the interval was cleared
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
      expect(mockChildLogger.info).toHaveBeenCalledWith({}, 'Session cleanup schedule cancelled.');
    });

    it('allows custom interval configuration', () => {
      // Mock a random interval ID
      const mockIntervalId = 123;
      setIntervalSpy.mockReturnValue(mockIntervalId);

      // Create a custom interval (30 minutes)
      const intervalMs = 30 * 60 * 1000;

      // Call function with custom interval
      service.scheduleSessionCleanup({ intervalMs });

      // Verify the interval was set with our custom value
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), intervalMs);

      // Verify the log contains our custom interval
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ intervalMs }),
        'Session cleanup scheduled.'
      );
    });

    it('runs immediately when configured to do so', () => {
      // Mock cleanup function behavior
      prismaMock.session.deleteMany.mockResolvedValue({ count: 5 });

      // Call with runImmediately option
      service.scheduleSessionCleanup({ runImmediately: true });

      // Verify cleanup function was called immediately
      expect(prismaMock.session.deleteMany).toHaveBeenCalled();
    });
  });
});
