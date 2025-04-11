import { NextRequest, NextResponse } from 'next/server';
import { defaultFirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { createLogger } from '@/lib/logger';

// Create logger instance
const logger = createLogger('api:test:auth');

// Helper functions and types moved to a separate file
import { createTestAuthService } from './service';

/**
 * Handler for POST requests to create a test session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const service = createTestAuthService(defaultFirebaseAdminService, logger);
  return service.processCreateSessionRequest(request);
}
