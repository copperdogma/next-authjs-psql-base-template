import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiLogger, createErrorResponse } from '@/lib/services/api-logger-service';
import pino from 'pino';
import { prisma } from '@/lib/prisma';

// Schema for validating POST request data
const HealthCheckRequestSchema = z.object({
  checkDatabase: z.boolean().optional().default(false),
  timeout: z.number().optional().default(100),
});

/**
 * Health Check GET Endpoint
 *
 * Used by E2E tests and monitoring tools to verify server availability
 * Returns: Basic server info including status, uptime, and environment
 */
export async function GET(): Promise<NextResponse> {
  // Health check endpoint is critical and must always work
  // Using direct implementation rather than wrapper to ensure reliability
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    serverInfo: {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '3000',
    },
  });
}

/**
 * Parses and validates the incoming request body
 */
async function parseAndValidateRequest(
  request: NextRequest,
  logger: pino.Logger
): Promise<
  | { isValid: false; error: NextResponse }
  | { isValid: true; data: z.infer<typeof HealthCheckRequestSchema> }
> {
  const body = await request.json();
  logger.debug({ body }, 'Received health check POST data');

  const result = HealthCheckRequestSchema.safeParse(body);

  if (!result.success) {
    logger.warn({ validationErrors: result.error.format() }, 'Invalid health check request format');

    // Using consistent error structure with ValidationError code
    return {
      isValid: false,
      error: NextResponse.json(
        {
          error: 'ValidationError',
          message: 'Invalid health check request format',
          details: result.error.format(),
        },
        { status: 400 }
      ),
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Performs optional database check based on request parameters
 */
async function performDatabaseCheck(
  checkDatabase: boolean,
  timeout: number,
  logger: pino.Logger
): Promise<void> {
  if (checkDatabase) {
    logger.debug('Database check requested');
    try {
      // Perform a lightweight database query to verify connectivity
      // Timeout parameter is not directly used as SELECT 1 should be very fast
      // If needed, more complex checks could implement a timeout mechanism
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('Database check completed successfully');
    } catch (error) {
      logger.warn({ error }, 'Database check failed');
      throw error; // Propagate the error to be handled by the caller
    }
  }
}

/**
 * Creates a success response with health information
 */
function createSuccessResponse(checkDatabase: boolean, timeout: number): NextResponse {
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    databaseChecked: checkDatabase,
    timeout,
  });
}

/**
 * Handles errors with appropriate logging and response
 */
function handleError(error: unknown, request: NextRequest, logger: pino.Logger): NextResponse {
  logger.error({ error }, 'Health check POST request processing failed');

  if (request.headers.has('x-request-id')) {
    return createErrorResponse(error, request.headers.get('x-request-id') || 'unknown');
  }

  return NextResponse.json(
    {
      error: 'InternalServerError',
      message: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
}

/**
 * Health Check POST Endpoint
 *
 * Validates request data and performs optional database check
 */
export const POST = withApiLogger(
  async (request: NextRequest, logger: pino.Logger): Promise<NextResponse> => {
    try {
      // Parse and validate the request
      const validationResult = await parseAndValidateRequest(request, logger).catch(() => ({
        isValid: false,
        error: null,
      }));

      if (!validationResult.isValid) {
        return (
          validationResult.error ||
          NextResponse.json(
            { error: 'ValidationError', message: 'Failed to parse request' },
            { status: 400 }
          )
        );
      }

      // TypeScript needs help understanding the shape of validationResult when isValid is true
      const data = 'data' in validationResult ? validationResult.data : null;

      if (!data) {
        return NextResponse.json(
          { error: 'ValidationError', message: 'Missing validation data' },
          { status: 400 }
        );
      }

      const { checkDatabase, timeout } = data;

      // Perform database check if requested
      await performDatabaseCheck(checkDatabase, timeout, logger).catch(error =>
        logger.warn({ error }, 'Database check failed but continuing')
      );

      // Return success response
      return createSuccessResponse(checkDatabase, timeout);
    } catch (error) {
      return handleError(error, request, logger);
    }
  }
);
