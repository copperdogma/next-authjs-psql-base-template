/**
 * Centralized service instantiation for server-side usage.
 * This ensures singletons are created and used consistently.
 */

import { initializeFirebaseAdminApp } from '../firebase-admin';
import { FirebaseAdminService } from '../services/firebase-admin-service';
import { logger } from '../logger';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { UserService } from '../services/user-service';
import { ProfileService } from '../services/profile-service';

// Initialize Firebase Admin App
// This might throw if credentials are missing, preventing server startup
const firebaseApp = initializeFirebaseAdminApp();

// Create singleton instance of FirebaseAdminService
export const firebaseAdminService = new FirebaseAdminService(
  firebaseApp,
  logger.child({ service: 'firebase-admin' })
);

// Database Client (using the global instance)
const dbClient: PrismaClient = prisma;

// User Service
export const userService = new UserService(dbClient, logger.child({ service: 'user' }));

// Profile Service
export const profileService = new ProfileService(
  userService,
  firebaseAdminService, // Inject Firebase Admin Service
  logger.child({ service: 'profile' })
);

// Logger for this setup file itself
const setupLogger = logger.child({ component: 'ServiceSetup' });
setupLogger.info('✅ Centralized server services initialized.');
