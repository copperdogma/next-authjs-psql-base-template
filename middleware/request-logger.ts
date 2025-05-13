import { type NextRequest } from 'next/server';
import { createLogger, getRequestId } from '@/lib/logger';

const logger = createLogger('api-request');

export function logRequestResponse(req: NextRequest, res: Response, startTime: number) {
  const requestDetails = {
    reqId: getRequestId(),
    method: req.method,
    path: req.nextUrl.pathname,
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
  };

  const responseDetails = {
    status: res.status,
    durationMs: Date.now() - startTime,
  };

  // Log based on response status
  if (res.status >= 500) {
    logger.error(
      { request: requestDetails, response: responseDetails },
      'API Request Completed with Server Error'
    );
  } else if (res.status >= 400) {
    logger.warn(
      { request: requestDetails, response: responseDetails },
      'API Request Completed with Client Error'
    );
  } else {
    logger.info(
      { request: requestDetails, response: responseDetails },
      'API Request Completed Successfully'
    );
  }
}
