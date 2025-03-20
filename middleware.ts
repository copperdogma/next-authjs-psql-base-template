import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/auth/session',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Get the Firebase session token from the request
  const sessionToken = request.cookies.get('session');

  // If it's a protected route and there's no session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // If it's a public route and there is a session token, redirect to dashboard
  if (isPublicRoute && sessionToken) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (we'll handle auth in the API routes themselves)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}; 