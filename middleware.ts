import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip API auth routes to avoid the NextAuth error
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip file requests
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Define public routes
  const publicRoutes = [
    '/login',
    '/register',
    '/api/health',
    '/', // Assuming home page is public
    '/about', // Make About page public
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(
    path => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  // Get the session token
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Redirect authenticated users from login to dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // Allow access for public routes or authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
