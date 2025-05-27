/**
 * Centralized service initialization for server-side logic.
 * Ensures singletons and manages dependencies.
 * Consider dependency injection patterns for more complex scenarios.
 */

import { PrismaClient } from '@prisma/client'; // Assuming Prisma is used
import { Redis } from 'ioredis'; // Assuming ioredis is used for RedisService, or similar
// @ts-expect-error AsyncLock types are not available but the package works correctly
import AsyncLock from 'async-lock';

import { logger as rootLogger } from '@/lib/logger';
import { UserService } from '@/lib/services/user-service';
import { ProfileService } from '@/lib/services/profile-service';
import { RawQueryServiceImpl } from '@/lib/services/raw-query-service';
import { prisma } from '@/lib/prisma';

const setupLogger = rootLogger.child({ module: 'services-setup' });

// Module-level service instances, initialized once
let prismaClientInstance: PrismaClient | null = null; // Renamed for clarity
let redisServiceInstance: Redis | null = null; // Renamed for clarity, adjust type as needed
let servicesInitialized = false;

const initLock = new AsyncLock();

async function initializePrisma(): Promise<boolean> {
  if (prismaClientInstance) {
    setupLogger.info('PrismaClient already initialized.');
    return true;
  }
  try {
    prismaClientInstance = prisma; // Use the imported prisma instance
    setupLogger.info('PrismaClient assigned successfully in services.ts');
    return true;
  } catch (error) {
    setupLogger.error({ err: error }, 'Failed to assign PrismaClient in services.ts');
    prismaClientInstance = null;
    return false;
  }
}

// Placeholder for Redis initialization - to be implemented if Redis is used
async function initializeRedis(): Promise<boolean> {
  if (redisServiceInstance) {
    setupLogger.info('RedisService already initialized.');
    return true;
  }
  // TODO: Add actual Redis client initialization here if needed
  // Example: redisServiceInstance = new Redis(env.REDIS_URL);
  setupLogger.info('Redis initialization placeholder. Not actually initializing Redis.');
  // For now, return true as if it were successful or not critical
  return true;
}

async function initializeServicesIfNeeded(): Promise<void> {
  await initLock.acquire('service-initialization', async () => {
    if (servicesInitialized) {
      setupLogger.info('Services already initialized.');
      return;
    }

    setupLogger.info('Attempting to initialize services...');

    const prismaOk = await initializePrisma();
    await initializeRedis(); // Placeholder

    // For now, consider services initialized if Prisma is OK.
    // Add Redis or other services to this check if they are critical.
    if (prismaOk) {
      servicesInitialized = true;
      setupLogger.info(
        'Core services (Prisma confirmed, Redis placeholder) marked as initialized.'
      );
    } else {
      setupLogger.error(
        'Core services FAILED to initialize (Prisma). servicesInitialized remains false.'
      );
    }
  });
}

// Only auto-initialize if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await initializeServicesIfNeeded();
  })();
}

// Similarly for Prisma and Redis if they follow async initialization or need guarding
export async function getPrismaClient(): Promise<PrismaClient | null> {
  await initializeServicesIfNeeded();
  if (!prismaClientInstance) {
    setupLogger.warn(
      'getPrismaClient: PrismaClient is not available after initialization attempt. Returning null.'
    );
  }
  return prismaClientInstance;
}

// Note: Adjust RedisService type and initialization as per actual implementation
export async function getRedisService(): Promise<Redis | null> {
  await initializeServicesIfNeeded();
  if (!redisServiceInstance) {
    setupLogger.warn(
      'getRedisService: RedisService is not available after initialization attempt (placeholder). Returning null.'
    );
  }
  return redisServiceInstance;
}

// Export instances of services that don't require async initialization
// These services typically take PrismaClient or other dependencies in their constructor.

// To ensure Prisma is ready for these, we might still want to call initializeServicesIfNeeded
// or ensure their constructors can handle a potentially null prismaClient initially if that's a valid state.
// For simplicity, let's assume they are requested after services are generally up.

let userServiceInstance: UserService | null = null;
export function getUserService(): UserService {
  if (!userServiceInstance) {
    if (!prismaClientInstance) {
      throw new Error('UserService cannot be initialized: PrismaClient not available.');
    }
    userServiceInstance = new UserService(
      prismaClientInstance,
      setupLogger.child({ service: 'UserService' })
    );
  }
  return userServiceInstance;
}

let profileServiceInstance: ProfileService | null = null;
export function getProfileService(): ProfileService {
  if (!profileServiceInstance) {
    if (!prismaClientInstance) {
      throw new Error('ProfileService cannot be initialized: PrismaClient not available.');
    }
    profileServiceInstance = new ProfileService(prismaClientInstance);
  }
  return profileServiceInstance;
}

let rawQueryServiceInstance: RawQueryServiceImpl | null = null;
export function getRawQueryService(): RawQueryServiceImpl {
  if (!rawQueryServiceInstance) {
    if (!prismaClientInstance) {
      throw new Error('RawQueryService cannot be initialized: PrismaClient not available.');
    }
    rawQueryServiceInstance = new RawQueryServiceImpl(
      prismaClientInstance,
      setupLogger.child({ service: 'RawQueryService' })
    );
  }
  return rawQueryServiceInstance;
}

// Export a base logger instance for general API use
// LoggerService is an interface, export the pino instance that implements it
const apiLoggerServiceInstance = rootLogger.child({ service: 'api' }); // This is a pino instance

// Log final status
if (!prismaClientInstance) {
  rootLogger.warn(
    'PrismaClient is not initialized. Services depending on it (e.g., UserService, ProfileService) will be unavailable.'
  );
} else {
  rootLogger.info('Server services initialized.');
}

// --- Export Services ---
export const apiLoggerService = apiLoggerServiceInstance;

export { setupLogger as appLogger };
