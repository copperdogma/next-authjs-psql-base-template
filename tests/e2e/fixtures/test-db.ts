import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { TEST_USER } from '../../utils/test-constants';

/**
 * TestDatabase provides utilities for managing test data in E2E tests
 */
export class TestDatabase {
  private prisma: PrismaClient;
  private testRunId: string;
  
  constructor() {
    // Generate a unique ID for this test run to isolate data between test runs
    this.testRunId = uuidv4().substring(0, 8);
    
    // Use test-specific database URL if provided
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      },
      log: process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['error'],
    });
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
      
      // Create a test user with the unique ID
      const user = await this.prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: `${TEST_USER.NAME} ${this.testRunId}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
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
      await this.prisma.user.deleteMany({
        where: {
          email: {
            contains: this.testRunId
          }
        }
      });
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
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Singleton instance for test suite
let testDbInstance: TestDatabase | null = null;

/**
 * Get or create the TestDatabase instance
 */
export function getTestDatabase(): TestDatabase {
  if (!testDbInstance) {
    testDbInstance = new TestDatabase();
  }
  return testDbInstance;
} 