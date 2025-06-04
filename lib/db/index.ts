/**
 * Database utilities and optimizers
 *
 * This module exports database-related utilities and query optimization tools.
 * For data services, please use the consolidated implementations from lib/services/ directory
 * or the dependency-injection getters from lib/server/services.ts.
 */

// Utilities for database operations
export * from './utils';

// Export query optimization tools
export * from './query-optimizer';

// NOTE: The following deprecated services have been consolidated:
// - UserService -> lib/services/user-service.ts
// - RawQueryService -> lib/services/raw-query-service.ts
// Please update imports to use the consolidated services
