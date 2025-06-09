// instrumentation.ts
export async function register() {
  // This check ensures the code runs only in the Node.js server environment
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Log that instrumentation is running (optional, for your confirmation)
    console.log('[Instrumentation] Initializing server-side components...');

    // Import the redis module. This will trigger the getRedisClient() function
    // in lib/redis.ts due to the line: export const redisClient = getRedisClient();
    // The existing logging within lib/redis.ts will then occur.
    const { redisClient } = await import('@/lib/redis');

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      if (redisClient) {
        try {
          await redisClient.quit();
          console.log('Redis client disconnected successfully.');
        } catch (err) {
          console.error('Error during Redis disconnection:', err);
        }
      }
      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Log that the attempt was made (optional)
    console.log('[Instrumentation] Redis client initialization sequence initiated via import.');
  }
}
