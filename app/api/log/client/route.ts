import { NextRequest, NextResponse } from 'next/server';
import { loggers } from '@/lib/logger'; // Use alias

const clientLogger = loggers.api.child({ source: 'client' });

// Define expected log entry structure (adjust as needed)
interface ClientLogEntry {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: Record<string, unknown>; // Use unknown instead of any
  timestamp?: string; // Optional client timestamp
}

export async function POST(request: NextRequest) {
  try {
    const logEntry = (await request.json()) as ClientLogEntry;

    // Basic validation
    if (!logEntry || !logEntry.level || !logEntry.message) {
      return NextResponse.json({ error: 'Invalid log entry' }, { status: 400 });
    }

    // Map client level to Pino logger function
    const logFunction = clientLogger[logEntry.level] || clientLogger.info;

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
