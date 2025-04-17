// =============================================================================
// Unit Testing Note:
// Unit testing Next.js Middleware, especially involving authentication logic
// and interaction with NextRequest/NextResponse objects (Edge Runtime), is
// notoriously difficult due to environment limitations and mocking challenges.
// Attempts to unit test this middleware encountered persistent issues like
// 'ReferenceError: Request is not defined'.
//
// Validation Strategy:
// Middleware functionality (route protection, redirects, public/private access)
// is primarily validated through End-to-End (E2E) tests that simulate user
// navigation and verify the resulting behavior in a browser context.
// =============================================================================
import { auth } from '@/lib/auth'; // Import auth function directly
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth'; // Keep Session type import

// Middleware configuration (matchers)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .*\..* (files with extensions, e.g., .png, .jpg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\..*).+)',
    // Explicitly include root path if needed, e.g., for protected root
    // '/,'
  ],
};

// Define public paths (adjust as necessary)
const publicPaths = ['/auth/login', '/auth/error'];

// Define the middleware logic directly as the default export
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  logger.debug({ msg: 'Middleware executing', pathname, method: req.method });

  // Check if the path is public
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  // Get session by calling the exported auth() function
  const session: Session | null = await auth();

  logger.debug({ msg: 'Middleware path check', pathname, isPublic, hasSession: !!session });

  if (isPublic) {
    logger.debug({ msg: 'Public path, allowing access', pathname });
    return NextResponse.next(); // Allow access to public paths
  }

  if (!session) {
    logger.info({ msg: 'No session, redirecting to login', pathname });
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // If authenticated and not a public path, allow access
  logger.debug({ msg: 'Authenticated user, allowing access', pathname, userId: session.user?.id });
  return NextResponse.next();
}
