import { PrismaClient } from '@prisma/client'
import { prisma } from '../../lib/prisma'

describe('Database Integration Tests', () => {
  let testPrisma: PrismaClient

  beforeAll(async () => {
    // Create a new Prisma client for testing
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  })

  afterAll(async () => {
    // Clean up test client
    await testPrisma.$disconnect()
  })

  describe('Database Connection', () => {
    it('should successfully connect to the database', async () => {
      // Test basic query execution
      const result = await testPrisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('result', 1)
    })

    it('should handle connection errors gracefully', async () => {
      const badPrisma = new PrismaClient({
        datasources: {
          db: {
            url: 'postgresql://invalid:5432/nonexistent',
          },
        },
      })

      await expect(
        badPrisma.$queryRaw`SELECT 1`
      ).rejects.toThrow()

      await badPrisma.$disconnect()
    })
  })

  describe('User Sync Functionality', () => {
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
    }

    afterEach(async () => {
      // Clean up test user
      await testPrisma.user.deleteMany({
        where: {
          email: testUser.email,
        },
      })
    })

    it('should create a new user successfully', async () => {
      const user = await testPrisma.user.create({
        data: testUser,
      })

      expect(user).toMatchObject(testUser)
    })

    it('should update existing user details', async () => {
      // Create initial user
      const createdUser = await testPrisma.user.create({
        data: testUser,
      })

      // Update user
      const updatedUser = await testPrisma.user.update({
        where: { id: createdUser.id },
        data: { name: 'Updated Name' },
      })

      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.email).toBe(testUser.email)
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