import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin';
import { prisma } from '../../../../lib/prisma';
import { HttpStatusCode } from '../../../../types/index';

// Session duration: 5 days
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: HttpStatusCode.BAD_REQUEST });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn: SESSION_DURATION,
    });

    // Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { email: decodedToken.email || '' },
      update: {
        name: decodedToken.name || null,
      },
      create: {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || null,
      },
    });

    // Store session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_DURATION),
      },
    });

    // Set the session cookie with settings that work in both dev and production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const cookieOptions = {
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_DURATION / 1000, // Convert to seconds for cookie expiry
      httpOnly: true,
      secure: !isDevelopment, // Only use secure in production to allow HTTP in development
      path: '/',
      sameSite: isDevelopment ? 'lax' : 'none' as 'lax' | 'none', // Use 'lax' in dev for HTTP, 'none' in prod
    };

    // Create response with cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: HttpStatusCode.UNAUTHORIZED });
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const response = NextResponse.json({ status: 'success' });
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const cookieOptions = {
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: !isDevelopment, // Only use secure in production to allow HTTP in development
      path: '/',
      sameSite: isDevelopment ? 'lax' : 'none' as 'lax' | 'none', // Use 'lax' in dev for HTTP, 'none' in prod
    };
    
    response.cookies.set(cookieOptions);
    
    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
  }
} 