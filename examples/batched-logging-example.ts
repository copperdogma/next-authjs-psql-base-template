/**
 * Example demonstrating batched logging usage for high-throughput scenarios
 *
 * This file shows how to use the batched logger for scenarios where you need
 * to generate a large number of logs without impacting performance.
 *
 * To run this example:
 * 1. Ensure TypeScript is installed
 * 2. Run: npx ts-node examples/batched-logging-example.ts
 */

// Note: This is an example file that imports modules which don't exist in this repository.
// This code is meant to be a demonstration of how batched logging could be implemented,
// but the imports are for illustrative purposes only.
//
// For the actual implementation, you would:
// 1. Create a batched-logger.ts file in the lib/services directory
// 2. Implement a logger factory in the lib/services directory
// 3. Replace the imports below with the correct paths

// Make this file a module
export {};

// For demonstration purposes - actual imports would be:
// import { createBatchedLogger } from '../lib/services/logger-factory';
// import { BatchedLoggerService } from '../lib/services/batched-logger';

// Mock implementation for the example
interface BatchedLoggerService {
  info(obj: object | string, msg?: string): void;
  error(obj: object | string, msg?: string): void;
  warn(obj: object | string, msg?: string): void;
  debug(obj: object | string, msg?: string): void;
  flush(): Promise<void>;
}

// Options interface for batched logger
interface BatchedLoggerOptions {
  batchSize?: number;
  flushIntervalMs?: number;
  asyncTransport?: boolean;
  additionalContext?: Record<string, unknown>;
}

// Mock factory function
function createBatchedLogger(_name: string, _options?: BatchedLoggerOptions): BatchedLoggerService {
  return {
    info: (obj, msg) => console.log('INFO', obj, msg),
    error: (obj, msg) => console.error('ERROR', obj, msg),
    warn: (obj, msg) => console.warn('WARN', obj, msg),
    debug: (obj, msg) => console.debug('DEBUG', obj, msg),
    flush: async () => console.log('Flushing logs...'),
  };
}

// Example demonstrating batched logging usage
async function runExample() {
  console.log('Starting batched logging example...');

  // Create a batched logger with custom settings
  const logger = createBatchedLogger('user-service', {
    batchSize: 50,
    flushIntervalMs: 5000,
  });

  // Log some events
  logger.info({ userId: 'user123' }, 'User logged in');
  logger.info({ userId: 'user123', action: 'update-profile' }, 'Profile updated');
  logger.info({ userId: 'user123', action: 'upload-avatar' }, 'Avatar uploaded');

  // Manually trigger flush for immediate processing
  if ('flush' in logger) {
    console.log('Flushing logs manually...');
    await logger.flush();
  }

  // In production, you would also call flush when the application is shutting down
  console.log('Example completed');
}

// Run the example
runExample().catch(console.error);
