import { PrismaClient } from '@prisma/client';

/**
 * TestDatabase provides utilities for managing test data in E2E tests
 */
export class TestDatabase {
  private prisma: PrismaClient;
  
  constructor() {
    // Use test-specific database URL if provided
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });
  }
  
  /**
   * Initialize the database with test data
   */
  async setupTestData() {
    try {
      // Clear existing data for clean tests
      await this.clearTestData();
      
      // Create a test user
      const user = await this.prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
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
      await this.prisma.user.deleteMany({});
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
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