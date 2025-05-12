import { headers } from 'next/headers';
import { logger } from '@/lib/logger'; // Assuming logger is available

const log = logger.child({ module: 'server-utils' });

/**
 * Retrieves the client's IP address from request headers.
 * Prefers 'x-forwarded-for', then 'x-real-ip'.
 * Returns a fallback IP ('0.0.0.0') if no IP is found or if an error occurs.
 * Designed to be used in Next.js Server Actions or Route Handlers.
 *
 * Important: IP addresses can be spoofed. This provides a best-effort IP
 * for rate limiting but shouldn't be the sole basis for critical security decisions.
 *
 * @returns {Promise<string>} The client IP address as a string, or a fallback if not determinable.
 */
export async function getClientIp(): Promise<string> {
  const fallbackIp = '0.0.0.0';
  try {
    const headersListResolved = await headers(); // Await headers() call, type will be inferred

    const forwardedFor = headersListResolved.get('x-forwarded-for'); // No await here
    if (forwardedFor) {
      // 'x-forwarded-for' can be a comma-separated list (client, proxy1, proxy2)
      // The first IP is usually the client's IP.
      const firstIp = forwardedFor.split(',')[0].trim();
      if (firstIp) return firstIp;
    }

    const realIp = headersListResolved.get('x-real-ip'); // No await here
    if (realIp) {
      return realIp.trim();
    }

    log.warn('No client IP address found in x-forwarded-for or x-real-ip headers. Using fallback.');
    return fallbackIp;
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error ? { message: error.message, name: error.name } : String(error),
        details: 'Error retrieving client IP from headers.',
      },
      'getClientIp failed, using fallback IP.'
    );
    return fallbackIp;
  }
}
