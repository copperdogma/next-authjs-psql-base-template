import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function globalTeardown() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('globalTeardown should only run in test environment')
  }

  try {
    // Clean up all data
    console.log('🧹 Cleaning up test database...')
    
    // Get all table names
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `

    // Truncate all tables
    for (const { tablename } of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`)
    }

    console.log('✅ Test database cleaned')
  } catch (error) {
    console.error('❌ Database cleanup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalTeardown 