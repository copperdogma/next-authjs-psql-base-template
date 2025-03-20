import { PrismaClient } from '@prisma/client'

/**
 * Global teardown function for test environment
 * 
 * This function safely cleans up the test database after tests run.
 * It's designed to be schema-agnostic and resilient to model changes.
 */
async function globalTeardown() {
  // Safety check to prevent accidental runs in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ SAFETY ERROR: Attempted to run test teardown in non-test environment')
    throw new Error('globalTeardown should only run in test environment')
  }

  const prisma = new PrismaClient()
  let cleanupSuccessful = false

  try {
    console.log('🧹 Cleaning up test database...')
    
    // First try: Disable foreign key checks and truncate all tables
    try {
      // Temporarily disable foreign key constraints
      await prisma.$executeRaw`SET session_replication_role = 'replica';`
      
      // Get all table names from the current schema
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations' -- Skip Prisma migrations table
      `
      
      // If no tables found, nothing to clean
      if (tables.length === 0) {
        console.log('ℹ️ No tables found in database')
        return
      }

      // Truncate all tables in a single transaction
      await prisma.$transaction(async (tx) => {
        for (const { tablename } of tables) {
          await tx.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`)
        }
      })
      
      cleanupSuccessful = true
    } catch (error) {
      console.warn('⚠️ Standard cleanup failed, attempting fallback method:', error)
      
      // Second try: Delete records from each table (fallback approach)
      try {
        // Get all tables with their dependencies ordered
        const tableOrder = await prisma.$queryRaw<Array<{ tablename: string }>>`
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename != '_prisma_migrations'
          ORDER BY tablename;
        `
        
        // Try to delete from each table in reverse order (dependencies last)
        for (const { tablename } of [...tableOrder].reverse()) {
          try {
            await prisma.$executeRawUnsafe(`DELETE FROM "public"."${tablename}"`)
          } catch (tableError) {
            console.warn(`- Could not clean table ${tablename}:`, tableError)
          }
        }
        
        cleanupSuccessful = true
      } catch (fallbackError) {
        console.error('❌ Fallback cleanup also failed:', fallbackError)
        throw fallbackError
      }
    } finally {
      // Always re-enable foreign key constraints
      await prisma.$executeRaw`SET session_replication_role = 'origin';`
    }

    if (cleanupSuccessful) {
      console.log('✅ Test database cleaned')
    }
  } catch (error) {
    console.error('❌ Database cleanup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalTeardown 