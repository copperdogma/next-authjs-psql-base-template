// instrumentation.ts
export async function register() {
  // This check ensures the code runs only in the Node.js server environment
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Log that instrumentation is running (optional, for your confirmation)
    console.log('[Instrumentation] Initializing server-side components...');

    // Import the redis module. This will trigger the getRedisClient() function
    // in lib/redis.ts due to the line: export const redisClient = getRedisClient();
    // The existing logging within lib/redis.ts will then occur.
    await import('@/lib/redis');

    // Log that the attempt was made (optional)
    console.log('[Instrumentation] Redis client initialization sequence initiated via import.');
  }
}
