import { NextResponse } from 'next/server';
import { LoggerService } from '@/lib/interfaces/services';

/**
 * Service for handling errors and responses
 */
export function createResponseService(logger: LoggerService) {
  /**
   * Creates a default validation error response
   */
  function createValidationErrorResponse(message = 'Invalid request body'): NextResponse {
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  /**
   * Creates a default emulator error response
   */
  function createEmulatorErrorResponse(): NextResponse {
    return NextResponse.json(
      { success: false, error: 'Firebase emulator not detected' },
      { status: 403 }
    );
  }

  /**
   * Creates an error response
   */
  function createErrorResponse(error: unknown): NextResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      msg: 'Error processing session request',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }

  return {
    createValidationErrorResponse,
    createEmulatorErrorResponse,
    createErrorResponse,
  };
}
