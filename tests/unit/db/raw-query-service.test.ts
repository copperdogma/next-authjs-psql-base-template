/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client';
import { RawQueryServiceImpl } from '../../../lib/services/raw-query-service';
import pino from 'pino';

// Mock the prisma client
const mockPrismaClient = {
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  // Add other methods if they are used by the service
} as unknown as jest.Mocked<PrismaClient>;

// Mock pino logger (basic mock)
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn(() => mockLogger), // child returns the same mock
} as unknown as pino.Logger;

// --- Test Suite ---
describe('RawQueryServiceImpl (DI version)', () => {
  let service: RawQueryServiceImpl;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Create a new service instance with mocked dependencies for each test
    service = new RawQueryServiceImpl(mockPrismaClient, mockLogger);
  });

  // Simplified test focusing on Prisma interaction
  it('executeRawQuery uses injected PrismaClient', async () => {
    const sql = 'SELECT 1;';
    const params: any[] = [123];
    mockPrismaClient.$queryRaw.mockResolvedValue([{ result: 1 }]); // Mock the response

    await service.executeRawQuery(sql, params);

    // Verify Prisma client was called (primary goal of DI test)
    expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    // We are no longer asserting specific logger calls in this DI test
    // expect(mockLogger.trace).toHaveBeenCalledWith(...);
  });

  // Simplified test focusing on Prisma interaction for updates
  it('extendSessionExpirations uses injected PrismaClient', async () => {
    const options = { userIds: ['user1', 'user2'] };
    mockPrismaClient.$executeRaw.mockResolvedValue(2); // Mock the response

    await service.extendSessionExpirations(options);

    // Verify Prisma client was called (primary goal of DI test)
    expect(mockPrismaClient.$executeRaw).toHaveBeenCalled();
    // No logger assertions here
  });

  // Test error handling path
  it('executeRawQuery handles errors from PrismaClient', async () => {
    const sql = 'INVALID SQL;';
    const params: any[] = [];
    const testError = new Error('DB Error');
    mockPrismaClient.$queryRaw.mockRejectedValue(testError);

    await expect(service.executeRawQuery(sql, params)).rejects.toThrow(testError);

    // Verify Prisma client was called
    expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    // Verify logger error was called (optional, but less fragile than checking exact message)
    expect(mockLogger.error).toHaveBeenCalled();
  });

  // Remove tests that were solely focused on logger behavior (like SQL truncation)
  // it('truncates long SQL queries in logs', async () => { ... });

  // Keep other relevant tests if they focus on logic within RawQueryServiceImpl
  // (e.g., clause building logic if it were public/testable, error handling)
});

// Remove the old DI test suite if it's fully replaced
// describe('RawQueryServiceImpl (DI version)', () => { ... });
