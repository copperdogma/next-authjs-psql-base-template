'use client';

// Define the structure matching the server endpoint expectation
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
interface ClientLogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
}

// Internal function to send the log data
function sendLog(entry: ClientLogEntry, useBeacon: boolean = false) {
  const endpoint = '/api/log/client';
  const body = JSON.stringify(entry);

  try {
    // Use sendBeacon for critical/error logs or when page might unload
    // It's asynchronous and non-blocking, but has data limits and no response access
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      if (!navigator.sendBeacon(endpoint, body)) {
        // Fallback to fetch if sendBeacon fails (e.g., data too large)
        console.warn('Client Logger: sendBeacon failed, falling back to fetch.');
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true, // Important for requests potentially during unload
        });
      }
    } else {
      // Use fetch for regular logs
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true, // Keepalive helps ensure delivery during page transitions
      });
    }
  } catch (error) {
    // Avoid logging errors from the logger itself to prevent loops
    console.error('Client Logger: Failed to send log entry:', error);
  }
}

// Helper to create log entries
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
): ClientLogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

// The exported logger object for client components
export const clientLogger = {
  trace: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('trace', message, context));
  },
  debug: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('debug', message, context));
  },
  info: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('info', message, context));
  },
  warn: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('warn', message, context));
  },
  // Use sendBeacon for errors and fatal by default for higher chance of delivery
  error: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('error', message, context), true);
  },
  fatal: (message: string, context?: Record<string, any>) => {
    sendLog(createLogEntry('fatal', message, context), true);
  },
};

export default clientLogger;
