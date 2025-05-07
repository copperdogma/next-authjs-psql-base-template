import { NextRequest, NextResponse } from 'next/server';
// import baseLogger from '@/lib/logger'; // Remove Pino import
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

// Helper to get console logging function based on level
const getConsoleMethod = (
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
): ((...data: unknown[]) => void) => {
  const levelMap: Record<typeof level, (...data: unknown[]) => void> = {
    trace: console.trace,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    fatal: console.error, // Map fatal to error
  };
  return levelMap[level] || console.log;
};

async function handleLogProcessing(body: unknown): Promise<NextResponse> {
  const result = ClientLogSchema.safeParse(body);

  if (!result.success) {
    // Log validation error using console.warn
    console.warn('Invalid client log entry received:', {
      validationErrors: result.error.format(),
      location: 'client-log-api-validation',
    });
    return NextResponse.json(
      { error: 'Invalid log entry', details: result.error.format() },
      { status: 400 }
    );
  }

  const { level, message, context: clientContext, timestamp: clientTimestamp } = result.data;
  const logMethod = getConsoleMethod(level);

  // Log the message with context using console
  logMethod(`[Client Log - ${level.toUpperCase()}] ${message}`, {
    clientContext,
    clientTimestamp,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting before processing the request
  const rateLimitResponse = await consumeRateLimit(request, generalApiLimiter);
  if (rateLimitResponse) {
    return rateLimitResponse; // Rate limit exceeded, return 429 response
  }

  let response: NextResponse;
  try {
    const body = await request.json();
    response = await handleLogProcessing(body);
  } catch (error) {
    // Log the error during processing on the server using console.error
    console.error('Error processing client log entry in POST handler:', {
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      location: 'client-log-api-post-handler',
    });
    response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // Add rate limit headers to the successful response or caught error response
  return addRateLimitHeaders(request, response, generalApiLimiter);
}
