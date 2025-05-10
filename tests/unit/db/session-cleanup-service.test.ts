/**
 * @jest-environment node
 */

import {
  cleanupExpiredSessions,
  cleanupUserSessions,
  scheduleSessionCleanup,
} from '../../../lib/db/session-cleanup-service';
import { jest } from '@jest/globals';

// No longer needed, use singleton mock
// jest.mock('../../../lib/prisma');

// Import the singleton mock
import { prismaMock, resetPrismaMock } from '../../mocks/db/prismaMocks';

// Mock logger
jest.mock('../../../lib/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  loggers: {
    db: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  },
}));

describe('Session Cleanup Service Functions', () => {
  // Track original setInterval
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPrismaMock();

    // No need to set up default mocks here if tests mock specific calls

    // Setup mock for setInterval
    global.setInterval = jest.fn().mockReturnValue(123) as any;
    global.clearInterval = jest.fn() as any;
  });

  afterEach(() => {
    // Reset the mocks
    jest.resetAllMocks();
  });

  afterAll(() => {
    // Restore original setInterval
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      // Arrange
      const deleteResult = { count: 5 };
      prismaMock.session.deleteMany.mockResolvedValue(deleteResult);

      // Act
      const result = await cleanupExpiredSessions();

      // Assert
      expect(result).toEqual({
        count: 5,
        timestamp: expect.any(Date),
      });
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle errors by rethrowing them', async () => {
      // Arrange
      const testError = new Error('Test error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);

      // Act & Assert
      await expect(cleanupExpiredSessions()).rejects.toThrow(testError);
    });
  });

  describe('cleanupUserSessions', () => {
    it('should delete all sessions for a user when keepCurrent is false', async () => {
      // Arrange
      const userId = 'user-123';
      // Explicitly mock deleteMany for this test
      prismaMock.session.deleteMany.mockResolvedValue({ count: 3 });

      // Act
      const result = await cleanupUserSessions(userId);

      // Assertions
      expect(result).toEqual({
        count: 3,
        keptCurrentSession: false,
        timestamp: expect.any(Date),
      });
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
      });
    });

    it('should keep the most recent session when keepCurrent is true', async () => {
      // Arrange
      const userId = 'user-123';
      const currentSessionId = 'session-456';
      // Explicitly mock deleteMany for this test (assuming 3 records deleted)
      prismaMock.session.deleteMany.mockResolvedValue({ count: 3 });

      // Setup mock for findFirst to return the current session
      prismaMock.session.findFirst.mockResolvedValue({ id: currentSessionId } as any);

      // Act
      const result = await cleanupUserSessions(userId, { keepCurrent: true });

      // Assertions
      expect(result).toEqual({
        count: 3, // Count of deleted records
        keptCurrentSession: true,
        timestamp: expect.any(Date),
      });
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          id: {
            not: currentSessionId,
          },
        },
      });
    });

    it('should throw an error if finding the current session fails', async () => {
      // Arrange
      const userId = 'user-123';
      const testError = new Error('Test error');
      prismaMock.session.findFirst.mockRejectedValue(testError);

      // Act & Assert
      await expect(cleanupUserSessions(userId, { keepCurrent: true })).rejects.toThrow(testError);
    });
  });

  describe('scheduleSessionCleanup', () => {
    it('should schedule cleanup with default interval', () => {
      // Act
      const cancelFn = scheduleSessionCleanup();

      // Assert cleanup was scheduled with the correct interval
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 24 * 60 * 60 * 1000); // Default is 24 hours

      // Test cancel function
      cancelFn();
      expect(global.clearInterval).toHaveBeenCalledWith(123);
    });

    it('should schedule cleanup with custom interval', () => {
      // Arrange
      const intervalMs = 1800000; // 30 minutes

      // Act
      scheduleSessionCleanup({ intervalMs });

      // Assert
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), intervalMs);
    });

    it('should run cleanup immediately by default', async () => {
      // Arrange
      const mockOnComplete = jest.fn();
      // Mock the underlying DB call needed for the immediate cleanup
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

      // Act
      scheduleSessionCleanup({ onComplete: mockOnComplete });

      // Wait for promises to resolve (using await Promise.resolve() can sometimes be safer)
      await Promise.resolve(); // Allow microtasks queue to flush
      await Promise.resolve(); // Sometimes needed twice for nested promises

      // Assert - cleanupExpiredSessions should have been called
      expect(prismaMock.session.deleteMany).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should not run cleanup immediately when runImmediately is false', async () => {
      // Act
      scheduleSessionCleanup({ runImmediately: false });

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Assert - cleanupExpiredSessions should not have been called
      expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
    });

    it('should handle errors during cleanup', async () => {
      // Arrange
      const testError = new Error('Test error');
      prismaMock.session.deleteMany.mockRejectedValue(testError);
      const mockOnError = jest.fn();

      // Act
      scheduleSessionCleanup({ onError: mockOnError });

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Assert - error handler should have been called
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });
  });
});
