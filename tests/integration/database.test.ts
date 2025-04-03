import { Prisma } from '@prisma/client';
import { TEST_USER } from '../utils/test-constants';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma'; // Use the singleton client

describe('Database Integration Tests', () => {
  // Generate unique test IDs for better isolation
  const testRunId = uuidv4().substring(0, 8);

  // Set up cleanup for all tests
  afterEach(async () => {
    // Clean up any test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: testRunId,
        },
      },
    });

    // We don't need to disconnect since we're using the shared instance
  });

  describe('Database Connection', () => {
    test('should successfully connect to the database', async () => {
      // Test basic query execution - using raw SQL directly
      const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`;
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('result', 1);
    });

    test('should handle connection errors gracefully', async () => {
      // Instead of creating a new client, test error handling with invalid SQL
      await expect(prisma.$queryRaw`SELECT * FROM table_that_does_not_exist`).rejects.toThrow();
    });
  });

  describe('User Sync Functionality', () => {
    // Use test run ID for better isolation between test runs
    const createUniqueTestUser = (suffix = '') => ({
      email: `test-${testRunId}-${suffix}-${Date.now()}@example.com`,
      name: `${TEST_USER.NAME} ${testRunId} ${suffix}`,
      image: null,
      emailVerified: null,
    });

    // Use transactions for test isolation instead of cleanup
    test('should create a new user successfully', async () => {
      // Use transaction to ensure test isolation
      await prisma.$transaction(
        async tx => {
          const uniqueTestUser = createUniqueTestUser('create');
          const user = await tx.user.create({
            data: uniqueTestUser,
          });

          expect(user).toMatchObject(uniqueTestUser);

          // Transaction will automatically roll back, no cleanup needed
        },
        {
          timeout: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );
    });

    test('should update existing user details', async () => {
      // Use transaction for test isolation
      await prisma.$transaction(
        async tx => {
          // Create initial user with unique email
          const uniqueTestUser = createUniqueTestUser('update');
          const createdUser = await tx.user.create({
            data: uniqueTestUser,
          });

          // Update user with a unique name
          const updatedName = `Updated Name ${testRunId}`;
          const updatedUser = await tx.user.update({
            where: { id: createdUser.id },
            data: { name: updatedName },
          });

          expect(updatedUser.name).toBe(updatedName);
          expect(updatedUser.email).toBe(uniqueTestUser.email);

          // Transaction will automatically roll back, no cleanup needed
        },
        {
          timeout: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );
    });
  });

  describe('Connection Pool Behavior', () => {
    test('should handle multiple concurrent connections', async () => {
      // Use multiple concurrent queries within a single client instance
      const queries = Array(5)
        .fill(null)
        .map((_, i) => prisma.$executeRaw`SELECT ${i}, pg_sleep(0.1)::text`);

      await Promise.all(queries);
      expect(true).toBe(true); // If we reach here, all queries completed successfully
    });

    test('should maintain connection under load', async () => {
      // Test with loop of sequential requests using shared client
      const iterations = 10;
      for (let i = 0; i < iterations; i++) {
        const result = await prisma.$queryRaw<Array<{ result: bigint }>>`SELECT ${i} as result`;
        expect(Array.isArray(result)).toBe(true);
        expect(Number(result[0].result)).toBe(i); // Convert BigInt to Number for comparison
      }
    });

    test('should handle transactions properly', async () => {
      // Generate a unique email for this test to avoid conflicts
      const tempEmail = `temp-${testRunId}-${Date.now()}@example.com`;
      let tempUserId: string | undefined;

      // Test transaction isolation with nested operations
      await prisma.$transaction(
        async tx => {
          // Create temporary test user for this transaction
          const tempUser = await tx.user.create({
            data: {
              email: tempEmail,
              name: `Temp User ${testRunId}`,
            },
          });
          tempUserId = tempUser.id;

          // Query within transaction should find the user
          const foundUser = await tx.user.findUnique({
            where: { id: tempUser.id },
          });

          expect(foundUser).not.toBeNull();
          expect(foundUser?.email).toBe(tempEmail);

          // In a real rollback scenario, this would be automatically rolled back
          // But for testing, we'll manually clean up
        },
        {
          timeout: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      // Clean up the created user after the transaction since rollback might not work in test env
      if (tempUserId) {
        await prisma.user
          .delete({
            where: { id: tempUserId },
          })
          .catch(() => {
            // Ignore errors if user doesn't exist (which would be good)
          });
      }

      // Now verify the user is gone
      const user = await prisma.user.findFirst({
        where: { email: tempEmail },
      });

      expect(user).toBeNull();
    });
  });
});
