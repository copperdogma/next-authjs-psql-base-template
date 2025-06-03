/**
 * Database utilities and services
 *
 * This module exports database-related utilities and service classes
 * that help prevent common issues like N+1 queries and provide
 * better error handling.
 *
 * Note: For user and raw query services, please use the consolidated
 * implementations from lib/services/ directory.
 */

// Utilities for database operations
export * from './utils';

// Domain-specific services
// DEPRECATED: Use lib/services/user-service.ts instead
// export * from './user-service';
// DEPRECATED: Use lib/services/raw-query-service.ts instead
// export * from './raw-query-service';
// Export functions, not the class
export * from './query-optimizer';
