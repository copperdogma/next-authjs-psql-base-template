/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { PrismaClient, Session, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { Logger } from 'pino';
import {
  SessionCleanupService,
  createSessionCleanupService,
} from '../../../lib/db/session-cleanup-service-di';

// Type for our mock logger to ensure proper typing
type MockLogger = {
  [K in keyof Logger]: jest.Mock;
} & Logger;

// Create mocks for our dependencies
const mockPrismaClient = mockDeep<PrismaClient>();

// Create a properly typed logger mock
const mockLogger = {
  child: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
} as unknown as MockLogger;

// Create a child logger with the same structure
const mockChildLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
} as unknown as MockLogger;

describe('Session Cleanup Service with Dependency Injection', () => {
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
    mockLogger.child.mockReturnValue(mockChildLogger);

    // Create service with injected dependencies
    service = createSessionCleanupService(prismaMock, mockLogger);

    jest.useFakeTimers({ doNotFake: [] });
    setIntervalSpy = jest.spyOn(global, 'setInterval') as unknown as jest.Mock;
    clearIntervalSpy = jest.spyOn(global, 'clearInterval') as unknown as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
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
      expect(mockLogger.child).toHaveBeenCalledWith({ component: 'db' });
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ count: 5 }),
        'Expired sessions cleaned successfully.'
      );
    });

    it('cleans up expired sessions with custom date', async () => {
      // Configure the mock
      prismaMock.session.deleteMany.mockResolvedValue({ count: 3 });
      const customDate = new Date('2023-01-01');

      // Call the function
      await service.cleanupExpiredSessions({ before: customDate });

      // Assert expectations
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: customDate,
          },
        },
      });
    });

    it('throws and logs error on prisma failure', async () => {
      const testError = new Error('Prisma Error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);

      await expect(service.cleanupExpiredSessions({})).rejects.toThrow('Prisma Error');

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: testError }),
        'Failed to cleanup expired sessions'
      );
    });
  });

  describe('cleanupUserSessions', () => {
    it('cleans up all sessions for a user', async () => {
      // Configure the mock
      prismaMock.session.deleteMany.mockResolvedValue({ count: 2 });
      const userId = 'test-user';

      // Call the function
      await service.cleanupUserSessions(userId);

      // Assert expectations
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaMock.session.findFirst).not.toHaveBeenCalled();
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2, userId }),
        'User sessions cleaned successfully.'
      );
    });

    it('keeps current session when specified', async () => {
      const mockSession: Session = {
        id: 'current-session-id',
        sessionToken: 'mock-token',
        userId: 'test-user',
        expires: new Date(Date.now() + 3600 * 1000),
      };

      // Configure the mocks
      prismaMock.session.findFirst.mockResolvedValue(mockSession);
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
      const userId = 'test-user';

      // Call the function
      await service.cleanupUserSessions(userId, { keepCurrent: true });

      // Assert expectations
      expect(prismaMock.session.findFirst).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { expires: 'desc' },
        select: { id: true },
      });

      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          id: { not: 'current-session-id' },
        },
      });
    });

    it('throws and logs error on findFirst failure when keepCurrent=true', async () => {
      const testError = new Error('Find Error');
      prismaMock.session.findFirst.mockRejectedValue(testError);
      const userId = 'test-user';

      await expect(service.cleanupUserSessions(userId, { keepCurrent: true })).rejects.toThrow(
        'Find Error'
      );

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: testError, userId }),
        'Failed to find current session for user'
      );
      expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
    });

    it('throws and logs error on deleteMany failure', async () => {
      const testError = new Error('Delete Error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);
      const userId = 'test-user';

      await expect(service.cleanupUserSessions(userId)).rejects.toThrow('Delete Error');

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: testError, userId }),
        'Failed to cleanup user sessions'
      );
    });
  });

  describe('scheduleSessionCleanup', () => {
    it('sets up interval with default interval', () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });

      // Call the function
      service.scheduleSessionCleanup();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);

      // The function should have been called immediately due to runImmediately=true default
      expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('sets up interval with custom interval', () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });
      const customInterval = 3600000;

      // Call the function
      service.scheduleSessionCleanup({ intervalMs: customInterval });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), customInterval);
      expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('does not run immediately if runImmediately is false', () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });

      service.scheduleSessionCleanup({ runImmediately: false });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000);
      expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
    });

    it('cancels the interval timer', () => {
      prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });

      // Call the function
      const cancelFn = service.scheduleSessionCleanup();

      // Initial run happens
      expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);

      const intervalId = setIntervalSpy.mock.results[0]?.value;
      expect(intervalId).toBeDefined();

      // Call the returned cancel function
      cancelFn();

      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
      expect(mockChildLogger.info).toHaveBeenCalledWith({}, 'Session cleanup schedule cancelled.');
    });

    it('calls the onComplete callback when cleanup succeeds', done => {
      // Arrange
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });
      let callbackCalled = false;
      const onCompleteMock = jest.fn().mockImplementation(() => {
        if (!callbackCalled) {
          callbackCalled = true;
          done();
        }
      });

      // Execute
      service.scheduleSessionCleanup({
        intervalMs: 10,
        runImmediately: true,
        onComplete: onCompleteMock,
      });

      // Manually trigger the interval callback
      jest.advanceTimersByTime(10);

      // Verify after a short delay to allow promises to resolve
      setTimeout(() => {
        expect(onCompleteMock).toHaveBeenCalled();
        done();
      }, 50);
    }, 10000);

    it('calls the onError callback when cleanup fails', async () => {
      // Setup - use real timers for async operations
      jest.useRealTimers();

      // Save original timer functions
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;

      // Mock timer functions
      global.setInterval = jest.fn().mockReturnValue(123) as unknown as typeof global.setInterval;
      global.clearInterval = jest.fn() as unknown as typeof global.clearInterval;

      // Mock the database to reject with a specific error
      const testError = new Error('Test error');
      prismaMock.session.deleteMany.mockRejectedValueOnce(testError);

      // Create a mock for the onError callback
      const onErrorMock = jest.fn();
      const errorCallbackPromise = new Promise<void>(resolve => {
        onErrorMock.mockImplementation((error: unknown) => {
          expect(error).toBe(testError);
          resolve();
        });
      });

      // Execute the function with immediate run
      const cancelFn = service.scheduleSessionCleanup({
        intervalMs: 100,
        runImmediately: true,
        onError: onErrorMock,
      });

      // Wait for the error handler to be called
      await errorCallbackPromise;

      // Verify the cancel function works
      cancelFn();
      expect(global.clearInterval).toHaveBeenCalledWith(123);

      // Restore timer functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    }, 10000);
  });
});
