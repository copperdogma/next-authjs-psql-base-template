import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating POST request data
const HealthCheckRequestSchema = z.object({
  checkDatabase: z.boolean().optional().default(false),
  timeout: z.number().int().positive().optional(),
});

/**
 * Health check endpoint for AI agents to verify server status
 * This endpoint returns basic server status information
 * Used by AI agents to confirm the server is running properly
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 }
  );
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
