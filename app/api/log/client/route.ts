import { NextRequest, NextResponse } from 'next/server';
import { loggers } from '@/lib/logger'; // Use alias
import { z } from 'zod';

const clientLogger = loggers.api.child({ source: 'client' });

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
  try {
    const body = await request.json();
    const result = ClientLogSchema.safeParse(body);

    if (!result.success) {
      // Log the validation error for debugging
      loggers.api.warn(
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

    const logEntry = result.data;

    // Map client level to Pino logger function
    // We know logEntry.level is valid because the schema validated it
    const logFunction = clientLogger[logEntry.level];

    // Log the message with context
    logFunction(
      {
        clientContext: logEntry.context,
        clientTimestamp: logEntry.timestamp,
        // Add any other relevant server-side context if needed
      },
      logEntry.message
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log the error during processing on the server
    loggers.api.error(
      {
        err: error,
        location: 'client-log-api',
      },
      'Error processing client log entry'
    );
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
