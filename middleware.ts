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

import { auth } from '@/lib/auth-edge'; // Import from edge config

// Config for route matching
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (static files, image optimization files)
     * - api/auth (Auth.js API routes)
     * - favicon.ico (favicon file)
     * Other assets (e.g., /icon-*.png) are typically ignored by default.
     */
    '/((?!api/auth|_next|favicon.ico).*)',
  ],
};

// Note: All previous complex middleware logic (route checks, redirects)
// has been removed as it's now handled by the `authorized` callback
// within the Auth.js configuration (`lib/auth.config.ts`).

// Re-export auth from auth-edge.ts to be used as middleware
// This automatically uses the `authorized` callback in authConfigEdge for route protection.
export default auth;
