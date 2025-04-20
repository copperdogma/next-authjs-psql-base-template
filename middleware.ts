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
// import { auth } from '@/lib/auth'; // CANNOT IMPORT THIS HERE (Prisma Adapter)
// import { logger } from '@/lib/logger'; // Still commented out due to previous build issues
import { NextRequest, NextResponse } from 'next/server';
// import { Session } from 'next-auth'; // No longer needed

console.log('[Middleware] Loading... (No auth() call)'); // Log when middleware module is loaded

// Middleware configuration (matchers) - USE ADJUSTED MATCHER THAT WORKED
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Also exclude files with extensions (e.g., .png)
     * Trying '*' instead of '+' and explicitly adding '/'
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'", // Changed .+ to .*
    '/', // Explicitly match the root path
  ],
};

// Define public paths (adjust as necessary)
const publicPaths = ['/login', '/auth/error', '/'];

// Determine potential session cookie names
const secureCookie = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
const sessionCookieName = secureCookie
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

console.log(`[Middleware] Expecting session cookie: ${sessionCookieName}`);

// Define the middleware logic directly as the default export
export default function middleware(req: NextRequest) {
  // Changed to sync function
  const { pathname } = req.nextUrl;

  // Log every request entering the middleware
  console.log(`[Middleware] Request received for: ${pathname}`);

  // Check if the path is public
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  // Check for the presence of the session cookie
  const hasSessionCookie = req.cookies.has(sessionCookieName);
  console.log(`[Middleware] Cookie check: ${sessionCookieName} present? ${hasSessionCookie}`);

  if (isPublic) {
    console.log('[Middleware] Public path, allowing access');
    return NextResponse.next(); // Allow access to public paths
  }

  // If it's not a public path AND the session cookie is missing, redirect to login
  if (!hasSessionCookie) {
    console.log('[Middleware] Protected path without session cookie, redirecting to login');
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // If it's not public but has a session cookie, allow access
  // (Actual session validity checked later by page/component)
  console.log(
    '[Middleware] Protected path with session cookie, allowing access (validation happens later)'
  );
  return NextResponse.next();
}
