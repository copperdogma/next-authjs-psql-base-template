/**
 * Database utilities and services
 *
 * This module exports database-related utilities and service classes
 * that help prevent common issues like N+1 queries and provide
 * better error handling.
 */

// Utilities for database operations
export * from './utils';

// Domain-specific services
export * from './user-service';
export * from './raw-query-service';
// Export functions, not the class
export {
  cleanupExpiredSessions,
  cleanupUserSessions,
  scheduleSessionCleanup,
} from './session-cleanup-service-di';
export * from './query-optimizer';
