import { NextRequest, NextResponse } from 'next/server';
// import baseLogger from '@/lib/logger'; // Remove Pino import
import { createLogger } from '@/lib/logger'; // Use the createLogger function
import { z } from 'zod';
import {
  generalApiLimiter,
  consumeRateLimit,
  addRateLimitHeaders,
} from '@/lib/utils/rate-limiters-middleware'; // Path to our rate limiter utils

// Define Zod schema for expected log entry structure
const ClientLogSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  message: z.string().min(1, 'Log message cannot be empty'),
  context: z.record(z.unknown()).optional(), // Record<string, unknown>
  timestamp: z.string().datetime({ offset: true }).optional(), // ISO 8601 string
});

// Infer the type from the schema
// type ClientLogEntry = z.infer<typeof ClientLogSchema>; // Removed unused type alias

// Create a logger instance for this API route
const logger = createLogger('client-log-api');

async function handleLogProcessing(body: unknown): Promise<NextResponse> {
  const result = ClientLogSchema.safeParse(body);

  if (!result.success) {
    // Log validation error using the logger
    logger.warn(
      {
        validationErrors: result.error.format(),
        location: 'client-log-api-validation',
      },
      'Invalid client log entry received'
    );
    return NextResponse.json(
      { error: 'Invalid log entry', details: result.error.format() },
      { status: 400 }
    );
  }

  const { level, message, context: clientContext, timestamp: clientTimestamp } = result.data;
  // const logMethod = getConsoleMethod(level); // Removed

  // Log the message with context using the logger's level methods
  logger[level](
    {
      clientContext,
      clientTimestamp,
    },
    `[Client Log] ${message}` // Simplified prefix
  );

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting before processing the request
  // Bypass rate limiting in E2E test environment
  if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV !== 'true') {
    const rateLimitResponse = await consumeRateLimit(request, generalApiLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse; // Rate limit exceeded, return 429 response
    }
  }

  let response: NextResponse;
  try {
    const body = await request.json();
    response = await handleLogProcessing(body);
  } catch (error) {
    // Log the error during processing on the server using the logger
    logger.error(
      {
        err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        location: 'client-log-api-post-handler',
      },
      'Error processing client log entry in POST handler'
    );
    response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // Add rate limit headers to the successful response or caught error response
  // Only add headers if not in E2E test environment (where they might be misleading)
  if (process.env.NEXT_PUBLIC_IS_E2E_TEST_ENV !== 'true') {
    return addRateLimitHeaders(request, response, generalApiLimiter);
  }
  return response;
}
