import { PrismaClient } from '@prisma/client'
import { DATABASE, TEST_USER } from '../utils/test-constants'
import { v4 as uuidv4 } from 'uuid' // We'll need to install this package

describe('Database Integration Tests', () => {
  let testPrisma: PrismaClient
  // Generate unique test IDs for better isolation
  const testRunId = uuidv4().substring(0, 8)

  beforeAll(async () => {
    // Create a new Prisma client for testing
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['error'],
    })
  })

  afterAll(async () => {
    // Clean up test client
    await testPrisma.$disconnect()
  })

  describe('Database Connection', () => {
    it('should successfully connect to the database', async () => {
      // Test basic query execution - using raw SQL directly
      const result = await testPrisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('result', 1)
    })

    it('should handle connection errors gracefully', async () => {
      // Create a new client with an invalid connection string from constants
      const badPrisma = new PrismaClient({
        datasources: {
          db: {
            url: DATABASE.INVALID_CONNECTION_STRING,
          },
        },
      })

      await expect(
        badPrisma.$queryRaw`SELECT 1`
      ).rejects.toThrow()

      // Clean up resources
      await badPrisma.$disconnect().catch(() => {
        // Ignore disconnect errors on a bad connection
      })
    })
  })

  describe('User Sync Functionality', () => {
    // Use test run ID for better isolation between test runs
    const testUserEmail = `test-${testRunId}@example.com`
    
    // Create a unique user for this test run
    const uniqueTestUser = {
      email: testUserEmail,
      name: `${TEST_USER.NAME} ${testRunId}`,
    }

    // Clean up before and after tests
    beforeEach(async () => {
      // Make sure we start with a clean slate
      await testPrisma.user.deleteMany({
        where: {
          email: uniqueTestUser.email,
        },
      })
    })

    afterEach(async () => {
      // Clean up test user
      await testPrisma.user.deleteMany({
        where: {
          email: uniqueTestUser.email,
        },
      })
    })

    it('should create a new user successfully', async () => {
      const user = await testPrisma.user.create({
        data: uniqueTestUser,
      })

      expect(user).toMatchObject(uniqueTestUser)
    })

    it('should update existing user details', async () => {
      // Create initial user
      const createdUser = await testPrisma.user.create({
        data: uniqueTestUser,
      })

      // Update user with a unique name
      const updatedName = `Updated Name ${testRunId}`
      const updatedUser = await testPrisma.user.update({
        where: { id: createdUser.id },
        data: { name: updatedName },
      })

      expect(updatedUser.name).toBe(updatedName)
      expect(updatedUser.email).toBe(uniqueTestUser.email)
    })
  })

  describe('Connection Pool Behavior', () => {
    it('should handle multiple concurrent connections', async () => {
      const queries = Array(5).fill(null).map(() => 
        testPrisma.$executeRaw`SELECT pg_sleep(0.1)::text`
      )

      await Promise.all(queries)
      expect(true).toBe(true) // If we reach here, all queries completed successfully
    })

    it('should maintain connection under load', async () => {
      const iterations = 10
      for (let i = 0; i < iterations; i++) {
        const result = await testPrisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`
        expect(Array.isArray(result)).toBe(true)
        expect(result[0]).toHaveProperty('result', 1)
      }
    })
  })
}) 