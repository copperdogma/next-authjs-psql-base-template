# Logging System Documentation

This document describes the logging system used in the Next.js Firebase PostgreSQL template.

## Overview

The logging system is built with several key features:

1. **Structured Logging**: JSON-formatted logs for better parsing and analysis
2. **Context-aware**: Contextual information automatically included in log entries
3. **Resilient**: Error handling, retries, circuit breaking, and fallback mechanisms
4. **Flexible**: Multiple transport options for different environments
5. **Performance-optimized**: Batching for high-throughput scenarios

## Logger Services

The logging system implements several services that enhance the core logger functionality:

### LoggerService Interface

All loggers implement the `LoggerService` interface, which defines the standard logging methods:

```typescript
interface LoggerService {
  info: (obj: object | string, msg?: string) => void;
  error: (obj: object | string, msg?: string) => void;
  warn: (obj: object | string, msg?: string) => void;
  debug: (obj: object | string, msg?: string) => void;
  trace?: (obj: object | string, msg?: string) => void;
  child?: (bindings: Record<string, unknown>) => LoggerService;
  context?: any;
}
```

### PinoLoggerService

The base logger implementation built on [Pino](https://getpino.io/), a very low overhead Node.js logger.

```typescript
// Creating a Pino logger with context
const logger = new PinoLoggerService('component-name', options);
// or
const logger = createContextLogger('component-name', options);
```

### ResilientLoggerService

Adds reliability mechanisms to any logger:

```typescript
const baseLogger = createContextLogger('component-name');
const resilientLogger = new ResilientLoggerService(baseLogger, {
  retries: 2, // Number of retry attempts
  retryDelay: 500, // Delay between retries (ms)
  maxFailures: 5, // Failures before circuit breaker trips
  resetTimeout: 30000, // Circuit breaker reset timeout (ms)
  fallbackToConsole: true, // Use console as a fallback
  criticalLevels: ['error', 'fatal'], // Levels that bypass circuit breaker
});
```

### BatchedLoggerService

Batches logs for high-throughput scenarios to improve performance:

```typescript
const baseLogger = createResilientLogger('high-throughput-component');
const batchedLogger = new BatchedLoggerService(baseLogger, {
  maxBatchSize: 100, // Maximum batch size before forced flush
  flushInterval: 5000, // Flush interval in milliseconds
  bypassLevels: ['error', 'fatal'], // Levels that bypass batching
});
```

## Factory Functions

Instead of directly instantiating logger services, use the factory functions for convenience:

```typescript
// Standard resilient logger
const logger = createResilientLogger({
  context: 'component-name',
  development: process.env.NODE_ENV !== 'production',
});

// API request logger
const requestLogger = createResilientApiLogger(requestId, path, method);

// Error handling logger
const errorLogger = createErrorHandlingLogger('error-handler');

// High-throughput logger
const batchedLogger = createBatchedLogger('batch-processor');
```

## Console Fallback Mechanism

The logging system includes a robust fallback mechanism to ensure logs aren't lost even when transports fail:

### How Fallback Works

When configured with `fallbackToConsole: true` (default), the `ResilientLoggerService` will:

1. Try to log using the configured transport (file, etc.)
2. If logging fails, it will retry based on the configured retry settings
3. If retries fail or the circuit breaker trips, it falls back to console logging
4. Critical logs (error, fatal) bypass the circuit breaker and always attempt delivery

### Console Output

When falling back to console, logs are formatted appropriately:

- `error` and `fatal` logs go to `console.error`
- `warn` logs go to `console.warn`
- `info` logs go to `console.info`
- `debug` and `trace` logs go to `console.debug`

A warning message is also displayed indicating that fallback has occurred, along with the original log details.

### Use Cases for Fallback

The fallback mechanism is especially useful in these scenarios:

1. File system permission issues prevent writing to log files
2. Disk space limitations
3. Network connectivity issues (if using remote logging)
4. During application startup before proper logging is initialized
5. When running in environments with restricted file access

## Best Practices

### Contextual Logging

Always provide context for your logs:

```typescript
// Create a logger with component context
const logger = createResilientLogger({ context: 'user-service' });

// Add request-specific context
const requestLogger = logger.child({
  requestId: 'req-123',
  userId: 'user-456',
});

// Log with both component and request context
requestLogger.info({ action: 'login' }, 'User logged in successfully');
```

### Error Logging

When logging errors, include the error object for proper stack traces:

```typescript
try {
  // Operation that might fail
} catch (error) {
  logger.error(
    {
      error,
      userId,
      operation: 'data-update',
    },
    'Failed to update user data'
  );
}
```

### Log Levels

Use appropriate log levels:

- `error`: For errors that need immediate attention
- `warn`: For warning conditions that don't break operation
- `info`: For normal but significant events
- `debug`: For detailed debugging information (dev environment)
- `trace`: For very detailed tracing (rarely used)
