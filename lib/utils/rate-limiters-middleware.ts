import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';
import { logger as log } from '@/lib/logger';

const generalApiPoints = 100; // Max 100 requests
const generalApiDuration = 15 * 60; // Per 15 minutes by IP

/**
 * General API Rate Limiter
 * For most API endpoints.
 *
 * Production considerations:
 * - For distributed environments, replace RateLimiterMemory with a store like
 *   RateLimiterRedis, RateLimiterMemcache, etc.
 * - Adjust points and duration based on specific API endpoint usage patterns.
 */
export const generalApiLimiter = new RateLimiterMemory({
  points: generalApiPoints,
  duration: generalApiDuration,
  blockDuration: generalApiDuration, // Block for the same duration as the window
});

// Example for a stricter limiter - can be used if specific sensitive routes are identified later
const authApiPoints = 20; // Max 20 requests
const authApiDuration = 15 * 60; // Per 15 minutes by IP

export const authApiLimiter = new RateLimiterMemory({
  points: authApiPoints,
  duration: authApiDuration,
  blockDuration: authApiDuration,
});

/**
 * Helper function to handle a rate-limited response.
 * @param req The NextRequest object.
 * @param rateLimiterResponse The response from rate-limiter-flexible.
 * @param limiterPoints The points from the specific limiter used.
 * @returns NextResponse A JSON response with status 429.
 */
function getRateLimitResponse(
  _req: NextRequest, // request object might be used for logging in future
  rateLimiterResponse: RateLimiterRes,
  limiterPoints: number // Pass the specific limiter's points
): NextResponse {
  const headers = {
    'Retry-After': String(rateLimiterResponse.msBeforeNext / 1000),
    'X-RateLimit-Limit': String(limiterPoints), // Use points from the specific limiter
    'X-RateLimit-Remaining': String(rateLimiterResponse.remainingPoints),
    'X-RateLimit-Reset': String(
      new Date(Date.now() + rateLimiterResponse.msBeforeNext).toISOString()
    ),
  };

  return NextResponse.json(
    {
      error: 'RateLimitExceeded',
      message: 'Too many requests, please try again later.',
      details: {
        retryAfterSeconds: Math.ceil(rateLimiterResponse.msBeforeNext / 1000),
        limitResetTime: new Date(Date.now() + rateLimiterResponse.msBeforeNext).toISOString(),
      },
    },
    { status: 429, headers }
  );
}

/**
 * Consumes a point from the specified rate limiter for the given request.
 * @param req The NextRequest object.
 * @param limiter The RateLimiterMemory instance to use.
 * @returns NextResponse if rate-limited, null otherwise.
 */
export async function consumeRateLimit(
  req: NextRequest,
  limiter: RateLimiterMemory
): Promise<NextResponse | null> {
  const key =
    (req as NextRequest & { ip?: string }).ip ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown_client';

  try {
    await limiter.consume(key);
    return null; // Not rate-limited
  } catch (rlRejected: unknown) {
    // Typed rlRejected as unknown
    if (rlRejected instanceof RateLimiterRes) {
      log.warn('Rate limit exceeded', {
        key: key,
        path: req.nextUrl.pathname,
        limiterInfo: { keyPrefix: limiter.keyPrefix as string | undefined }, // Explicitly type for logger context
      });
      // Pass limiter.points to getRateLimitResponse
      return getRateLimitResponse(req, rlRejected, limiter.points);
    }
    log.error('Unexpected error from rate limiter', {
      error:
        rlRejected instanceof Error
          ? { message: rlRejected.message, stack: rlRejected.stack }
          : rlRejected,
      key,
      path: req.nextUrl.pathname,
    });
    // Fallback to allow request if unknown error, or could deny
    return NextResponse.json({ error: 'Internal Server Error in Rate Limiter' }, { status: 500 });
  }
}

/**
 * Attaches rate limit headers to an outgoing response if the request was not blocked.
 * This is intended to be called after a successful limiter.consume() and after the main
 * route handler has generated its response.
 * @param req The NextRequest.
 * @param res The NextResponse from the route handler.
 * @param limiter The limiter instance that was checked.
 * @returns The NextResponse with added rate limit headers, or the original response if an error occurs.
 */
export async function addRateLimitHeaders(
  req: NextRequest,
  res: NextResponse,
  limiter: RateLimiterMemory
): Promise<NextResponse> {
  const key =
    (req as NextRequest & { ip?: string }).ip ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown_client';
  try {
    const limiterRes = await limiter.get(key);
    if (limiterRes && limiterRes.remainingPoints >= 0) {
      res.headers.set('X-RateLimit-Limit', String(limiter.points));
      res.headers.set('X-RateLimit-Remaining', String(limiterRes.remainingPoints));
      res.headers.set(
        'X-RateLimit-Reset',
        String(new Date(Date.now() + limiterRes.msBeforeNext).toISOString())
      );
    }
  } catch (error: unknown) {
    // Typed error as unknown
    log.error('Failed to get rate limiter info for headers', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      key,
      path: req.nextUrl.pathname,
    });
    // Do not fail the request, just skip adding headers
  }
  return res;
}
