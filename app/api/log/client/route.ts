import { NextRequest, NextResponse } from 'next/server';
// import baseLogger from '@/lib/logger'; // Remove Pino import
import { z } from 'zod';

// Define Zod schema for expected log entry structure
const ClientLogSchema = z.object({
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  message: z.string().min(1, 'Log message cannot be empty'),
  context: z.record(z.unknown()).optional(), // Record<string, unknown>
  timestamp: z.string().datetime({ offset: true }).optional(), // ISO 8601 string
});

// Infer the type from the schema
// type ClientLogEntry = z.infer<typeof ClientLogSchema>; // Removed unused type alias

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Remove Pino logger usage
  // const logger = baseLogger;

  try {
    const body = await request.json();
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

    const logEntry = result.data;
    // Remove child logger creation
    // const clientLogContextLogger = logger.child({ source: 'client', context: 'api' });

    // Map client level to console method (handle 'fatal' explicitly)
    let logMethod;
    switch (logEntry.level) {
      case 'trace':
        logMethod = console.trace;
        break;
      case 'debug':
        logMethod = console.debug;
        break;
      case 'info':
        logMethod = console.info;
        break;
      case 'warn':
        logMethod = console.warn;
        break;
      case 'error':
      case 'fatal': // Map fatal to error
        logMethod = console.error;
        break;
      default:
        logMethod = console.log;
    }

    // Log the message with context using console
    logMethod(`[Client Log - ${logEntry.level.toUpperCase()}] ${logEntry.message}`, {
      clientContext: logEntry.context,
      clientTimestamp: logEntry.timestamp,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log the error during processing on the server using console.error
    console.error('Error processing client log entry:', {
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      location: 'client-log-api',
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
