import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin';
import { prisma } from '../../../../lib/prisma';

// Session duration: 5 days
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
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

    // Set the session cookie
    const cookieOptions = {
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // Create response with cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 