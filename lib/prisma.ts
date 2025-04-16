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

  // Datasource URL is handled by env("DATABASE_URL") in schema.prisma
  // No need to explicitly set it here again, especially for production.
  // if (process.env.NODE_ENV === 'production') {
  //   // Adjust connection pool for production environment
  //   // For long-running applications, increase the pool size
  //   // For serverless, keep it small (typically 1-3)
  //   config.datasources = {
  //     db: {
  //       url: process.env.DATABASE_URL,
  //     },
  //   };
  // }

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
