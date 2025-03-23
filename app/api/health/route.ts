import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define a schema for the health check response
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string().optional(),
});

// Type inference from the schema
type HealthResponse = z.infer<typeof HealthResponseSchema>;

// Schema for validating POST request data
const HealthCheckRequestSchema = z.object({
  checkDatabase: z.boolean().optional().default(false),
  timeout: z.number().int().positive().optional(),
});

// Type inference for the request schema
type HealthCheckRequest = z.infer<typeof HealthCheckRequestSchema>;

export async function GET() {
  // Create a response object that matches the schema
  const healthData: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };

  // Validate the response data against the schema
  const result = HealthResponseSchema.safeParse(healthData);

  if (!result.success) {
    console.error('Invalid health response format:', result.error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Return the validated data
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body as JSON
    const body = await request.json();

    // Validate request body against the schema
    const result = HealthCheckRequestSchema.safeParse(body);

    if (!result.success) {
      // Return validation errors
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    // Use the validated data (type-safe)
    const validatedData = result.data;

    // Example of using the validated data
    const response: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    };

    // Add logic based on the validated request
    if (validatedData.checkDatabase) {
      // Perform database check (simplified example)
      response.status = (await checkDatabaseHealth()) ? 'healthy' : 'degraded';
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

// Mock function for database checking
async function checkDatabaseHealth(): Promise<boolean> {
  // In a real implementation, you would check your database connection
  return true;
}
