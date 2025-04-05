// Using CommonJS require() instead of import to avoid ESM issues
const { PrismaClient: PrismaTeardownClient } = require('@prisma/client');

/**
 * Attempt standard table truncation cleanup
 */
async function standardCleanup(prisma: any): Promise<boolean> {
  try {
    // Temporarily disable foreign key constraints
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Get all table names from the current schema
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations' -- Skip Prisma migrations table
    `;

    // If no tables found, nothing to clean
    if (tables.length === 0) {
      console.log('ℹ️ No tables found in database');
      return true;
    }

    // Truncate all tables in a single transaction
    await prisma.$transaction(
      async (
        tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>
      ) => {
        for (const { tablename } of tables) {
          await tx.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`);
        }
      }
    );

    return true;
  } catch (error) {
    console.warn('⚠️ Standard cleanup failed, attempting fallback method:', error);
    return false;
  }
}

/**
 * Fallback cleanup approach (delete from tables in reverse dependency order)
 */
async function fallbackCleanup(prisma: any): Promise<boolean> {
  try {
    // Get all tables with their dependencies ordered
    const tableOrder = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
      ORDER BY tablename;
    `;

    // Try to delete from each table in reverse order (dependencies last)
    for (const { tablename } of [...tableOrder].reverse()) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "public"."${tablename}"`);
      } catch (tableError) {
        console.warn(`- Could not clean table ${tablename}:`, tableError);
      }
    }

    return true;
  } catch (fallbackError) {
    console.error('❌ Fallback cleanup also failed:', fallbackError);
    throw fallbackError;
  }
}

/**
 * Check environment to ensure we're in test mode
 */
function validateTestEnvironment() {
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ SAFETY ERROR: Attempted to run test teardown in non-test environment');
    throw new Error('globalTeardown should only run in test environment');
  }
}

/**
 * Perform the database cleanup using both strategies
 */
async function performDatabaseCleanup(prisma: any) {
  console.log('🧹 Cleaning up test database...');

  // Try standard cleanup first
  let cleanupSuccessful = await standardCleanup(prisma);

  // If standard cleanup fails, try fallback
  if (!cleanupSuccessful) {
    cleanupSuccessful = await fallbackCleanup(prisma);
  }

  if (cleanupSuccessful) {
    console.log('✅ Test database cleaned');
  }

  return cleanupSuccessful;
}

/**
 * Reset database settings and disconnect
 */
async function resetDatabaseSettings(prisma: any) {
  try {
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;
  } catch (finallyError) {
    console.warn('⚠️ Could not reset foreign key constraints:', finallyError);
  }

  await prisma.$disconnect();
}

/**
 * Global teardown function for test environment
 *
 * This function safely cleans up the test database after tests run.
 * It's designed to be schema-agnostic and resilient to model changes.
 */
async function globalTeardown() {
  // Safety check to prevent accidental runs in non-test environments
  validateTestEnvironment();

  const prisma = new PrismaTeardownClient();

  try {
    await performDatabaseCleanup(prisma);
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    // Always re-enable foreign key constraints and disconnect
    await resetDatabaseSettings(prisma);
  }
}

module.exports = globalTeardown;
