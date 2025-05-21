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

// import { type NextRequest, NextResponse } from "next/server"; // Not needed directly
import { auth } from '@/lib/auth-edge';
// import NextAuth from 'next-auth';

// Initialize NextAuth with the edge-compatible configuration
// const { auth } = NextAuth(authConfigEdge);

// Export the auth middleware as the default export for Next.js to pick up.
// This will use the `authorized` callback within authConfigEdge for route protection.
export default auth;

// Config for route matching: apply this middleware to all routes except for
// Next.js internals (_next), static assets (favicon.ico), and NextAuth API routes (/api/auth).
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|\.well-known\/).*)'],
};

// Note: Custom rate-limiting logic for specific API endpoints (e.g., /api/log/client)
// will be handled within those individual route handlers to avoid complexities with
// chaining or manually invoking the NextAuth.js middleware handler, which has proven
// problematic due to type signature mismatches in this context.
