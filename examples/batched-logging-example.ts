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

import { createBatchedLogger } from '../lib/services/logger-factory';
import { BatchedLoggerService } from '../lib/services/batched-logger';

// Create a batched logger with custom settings
const logger = createBatchedLogger('example-batched', {
  // Use smaller batch size for example
  maxBatchSize: 5,
  // Shorter flush interval for example
  flushInterval: 2000,
});

console.log('Starting batched logging example...');
console.log('Watch the logs to see batching in action - notice how logs appear in groups');

// Simulate high-throughput logging
async function simulateHighThroughput() {
  // Log start of simulation
  logger.info('Starting high-throughput simulation');

  // Generate a bunch of logs
  for (let i = 0; i < 20; i++) {
    logger.debug({ iteration: i, timestamp: Date.now() }, `Processing item ${i}`);

    // Every 5 iterations, log something at info level
    if (i % 5 === 0) {
      logger.info(
        {
          progress: Math.round((i / 20) * 100),
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        },
        `Progress: ${Math.round((i / 20) * 100)}%`
      );
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Log an error to demonstrate bypass behavior
  logger.error({ errorCode: 'EXAMPLE_ERROR' }, 'This error bypasses batching');

  // Add some more logs
  logger.info({ processingTime: '2.5s' }, 'Simulation completed');

  // Force flush any remaining logs
  if (logger instanceof BatchedLoggerService) {
    logger.flush();
  }

  console.log('Simulation complete! Check the logs to see batching in action.');
}

// Run the simulation
simulateHighThroughput().catch(err => {
  console.error('Error in simulation:', err);
  process.exit(1);
});
