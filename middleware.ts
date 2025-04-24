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

// import NextAuth from 'next-auth'; // No longer needed directly
import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-edge'; // Import from edge config
import { loggers } from '@/lib/logger';
// import { PUBLIC_ROUTES, AUTH_ROUTES, DEFAULT_LOGIN_REDIRECT } from '@/lib/routes'; // Cannot find this file
// import { logger } from '@/lib/logger'; // Logger is implicitly used by auth

const logger = loggers.middleware;

// Initialize NextAuth with the Edge-compatible config and export the middleware handler.
// The `auth` property returned by NextAuth contains the middleware function.
// export const { auth: middleware } = NextAuth(authConfig);

// The `authorized` callback in `lib/auth.ts` handles the logic.
// We export the `auth` function directly as the middleware.
// export default auth((req) => {
//   const { nextUrl } = req;
//   const isLoggedIn = !!req.auth;
//   middlewareLogger.debug({ isLoggedIn, pathname: nextUrl.pathname }, 'Processing request');
// });

// Export the default auth middleware directly
// The logic is handled within the authorized callback in lib/auth-edge.ts
export default auth(req => {
  // Auth.js handles authentication checks via the authorized callback
  // This middleware function can add additional custom logic if needed

  const { auth: session, nextUrl } = req;
  const isAuthenticated = !!session;

  logger.debug({
    msg: '[Middleware] Processing request',
    path: nextUrl.pathname,
    isAuthenticated,
    userId: session?.user?.id,
  });

  // Let Auth.js handle route protection based on the authorized callback
  return NextResponse.next();
});

// Config for route matching
export const config = {
  // Matcher ignoring specific paths (e.g., _next/static, _next/image, favicon.ico)
  // and API routes under /api/log/client
  matcher: ['/((?!api/log/client|_next/static|_next/image|favicon.ico).*)'],
};

// Note: All previous complex middleware logic (route checks, redirects)
// has been removed as it's now handled by the `authorized` callback
// within the Auth.js configuration (`lib/auth.config.ts`).

// --- Temporary Middleware Disablement ---
// The placeholder middleware below has been removed.

// import { NextRequest, NextResponse } from 'next/server';

// // Add a simple placeholder middleware
// export default function middleware(req: NextRequest) {
//   // Do nothing, just let the request proceed
//   return NextResponse.next();
// }

// Also comment out the original config for now
// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// };

// Re-export auth from auth-edge.ts to be used as middleware
// This automatically uses the `authorized` callback in authConfigEdge for route protection.
export { auth as middleware } from '@/lib/auth-edge';
