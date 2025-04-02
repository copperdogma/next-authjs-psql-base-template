import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { TEST_USER } from '../../utils/test-constants';
import { prisma } from '../../../lib/prisma'; // Import the singleton PrismaClient

/**
 * TestDatabase provides utilities for managing test data in E2E tests
 * With improved transaction support for better test isolation
 */
export class TestDatabase {
  private testRunId: string;
  private useTransactions: boolean;

  constructor(useTransactions = true) {
    // Generate a unique ID for this test run to isolate data between test runs
    this.testRunId = uuidv4().substring(0, 8);
    this.useTransactions = useTransactions;
  }

  /**
   * Initialize the database with test data
   */
  async setupTestData() {
    try {
      // Clear existing data for clean tests
      await this.clearTestData();

      // Create a unique ID for this user to avoid conflicts
      const userId = `test-${this.testRunId}-${uuidv4().substring(0, 6)}`;
      const email = `test-${this.testRunId}@example.com`;

      // Create test data within a transaction if enabled
      let user;

      if (this.useTransactions) {
        // Use transaction for atomic operations
        user = await prisma.$transaction(
          async tx => {
            // Create a test user with the unique ID
            return tx.user.create({
              data: {
                id: userId,
                email: email,
                name: `${TEST_USER.NAME} ${this.testRunId}`,
                image: TEST_USER.PHOTO_URL,
                emailVerified: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          },
          {
            // Set transaction timeout and isolation level
            timeout: 10000, // 10 seconds
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          }
        );
      } else {
        // Create without transaction for scenarios where it's not appropriate
        user = await prisma.user.create({
          data: {
            id: userId,
            email: email,
            name: `${TEST_USER.NAME} ${this.testRunId}`,
            image: TEST_USER.PHOTO_URL,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return { user };
    } catch (error) {
      console.error('Error setting up test data:', error);
      throw error;
    }
  }

  /**
   * Clean up all test data
   */
  async clearTestData() {
    try {
      // Delete in correct order to handle foreign keys
      // Delete only test data created with this test run ID (improved isolation)
      if (this.useTransactions) {
        await prisma.$transaction(async tx => {
          // We need to delete sessions first due to foreign key constraints
          await tx.session.deleteMany({
            where: {
              user: {
                email: {
                  contains: this.testRunId,
                },
              },
            },
          });

          await tx.user.deleteMany({
            where: {
              email: {
                contains: this.testRunId,
              },
            },
          });
        });
      } else {
        // Sequential deletion without transaction
        await prisma.session.deleteMany({
          where: {
            user: {
              email: {
                contains: this.testRunId,
              },
            },
          },
        });

        await prisma.user.deleteMany({
          where: {
            email: {
              contains: this.testRunId,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }

  /**
   * Get the test run ID for this instance
   */
  getTestRunId() {
    return this.testRunId;
  }

  /**
   * No need to disconnect since we're using the shared Prisma instance
   * This is left for API compatibility with existing tests
   */
  async disconnect() {
    // No need to disconnect the shared instance
    // This is intentionally empty
  }
}

// Singleton instance for test suite
let testDbInstance: TestDatabase | null = null;

/**
 * Get or create the TestDatabase instance
 */
export function getTestDatabase(useTransactions = true): TestDatabase {
  if (!testDbInstance) {
    testDbInstance = new TestDatabase(useTransactions);
  }
  return testDbInstance;
}
