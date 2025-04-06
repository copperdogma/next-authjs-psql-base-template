import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating POST request data
const HealthCheckRequestSchema = z.object({
  checkDatabase: z.boolean().optional().default(false),
  timeout: z.number().int().positive().optional(),
});

/**
 * Health Check API Endpoint
 *
 * Used by E2E tests and monitoring tools to verify server availability
 * Returns: Basic server info including status, uptime, and environment
 */
export async function GET() {
  // console.error('##### Test Server Log Error Triggered #####'); // Temporary error removed
  // TODO: Add checks for database, Redis, etc.
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    serverInfo: {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || process.env.TEST_PORT || '3000',
      nextVersion: process.env.NEXT_VERSION || 'unknown',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request against our schema
    const result = HealthCheckRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: result.error.format() },
        { status: 400 }
      );
    }

    const { checkDatabase } = result.data;

    // Example of conditional health check based on request
    if (checkDatabase) {
      // In a real app, you might check database connectivity here
      // For demo purposes, we're just adding a mock delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Example of using the validated data
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databaseChecked: checkDatabase,
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
