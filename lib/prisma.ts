import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Global PrismaClient instance with optimized connection settings.
 * Uses singleton pattern to prevent multiple instances in development.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Configuration based on environment
const getPrismaConfig = (): Prisma.PrismaClientOptions => {
  const config: Prisma.PrismaClientOptions = {};

  // Only log errors in production, more verbose in development
  if (process.env.NODE_ENV === 'production') {
    config.log = ['error', 'warn'];
  } else {
    // Development logging - queries can be enabled for debugging
    config.log = process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['error', 'warn'];
  }

  // IMPORTANT: Production Connection Pooling
  // The default Prisma connection pool size might not be optimal for your production environment.
  // For long-running applications (e.g., Node.js servers), you might need to increase the connection_limit.
  // For serverless environments, a smaller pool (or Prisma Accelerate/Data Proxy) is typically recommended.
  // Consult Prisma's documentation on connection management for your specific deployment:
  // https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
  if (process.env.NODE_ENV === 'production') {
    // Example for a long-running server (uncomment and adjust connection_limit as needed):
    // config.datasources = {
    //   db: {
    //     url: process.env.DATABASE_URL + "&connection_limit=10&pool_timeout=5",
    //   },
    // };
    // Example for serverless environments (uncomment for minimal connections):
    // config.datasources = {
    //   db: {
    //     url: process.env.DATABASE_URL + "&connection_limit=1&pool_timeout=10",
    //   },
    // };
    // If using Prisma Accelerate or Data Proxy, no connection_limit is needed
    // as the proxy manages connections for you.
  }

  return config;
};

// Create or reuse PrismaClient instance
export const prisma = globalForPrisma.prisma || new PrismaClient(getPrismaConfig());

// Prevent multiple instances during hot reloading in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Disconnect from the database.
 * Use this function during application shutdown or for cleanup in tests.
 */
export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
}

// Re-export PrismaClient type for use in other modules
export type { PrismaClient };
