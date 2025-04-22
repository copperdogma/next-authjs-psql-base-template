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

// Re-export auth from lib/auth.ts to be used as middleware
// This automatically uses the `authorized` callback in authConfig for route protection.
export { auth as middleware } from '@/lib/auth';

// Configuration for route matching remains necessary
// This ensures the middleware runs only on specified paths.
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
