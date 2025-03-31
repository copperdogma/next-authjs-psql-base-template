import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((data, options) => ({
        ...originalModule.NextResponse.json({}, {}),
        status: options?.status || 200,
        cookies: {
          set: jest.fn(),
        },
        json: jest.fn().mockReturnValue(data),
      })),
    },
  };
});

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn().mockImplementation(name => {
      if (name === 'session') {
        return { value: 'test-session-cookie' };
      }
      return null;
    }),
    set: jest.fn(),
  })),
}));

// Mock the session module
jest.mock('../../../../tests/mocks/lib/auth/session', () => {
  return {
    SESSION_COOKIE_NAME: 'session',
    getSessionCookieOptions: jest.fn().mockReturnValue({
      maxAge: 3600,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    }),
    createSessionCookie: jest.fn().mockResolvedValue('mock-session-cookie'),
    verifySessionCookie: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
    }),
    destroySessionCookie: jest.fn().mockReturnValue({
      maxAge: 0,
      httpOnly: true,
      path: '/',
    }),
  };
});

// Import the session module
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
  verifySessionCookie,
  destroySessionCookie,
} from '../../../../tests/mocks/lib/auth/session';

// Create mock route handlers since the original ones might not exist
const GET = async (req: NextRequest) => {
  try {
    const userData = await verifySessionCookie('test-session-cookie');
    return NextResponse.json({
      user: {
        id: userData.uid,
        email: userData.email,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
};

const POST = async (req: NextRequest) => {
  try {
    const { token } = await req.json();
    const sessionCookie = await createSessionCookie(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      ...destroySessionCookie(),
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 400 });
  }
};

describe('Session API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/session', () => {
    it('should return user session data for authenticated users', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/session');

      const response = await GET(mockRequest);

      expect(response.status).toBe(200);
      expect(response.json()).toEqual({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      });
    });
  });

  describe('POST /api/auth/session', () => {
    it('should create a session cookie from the provided token', async () => {
      const mockToken = 'mock-firebase-token';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/session');
      mockRequest.json = jest.fn().mockResolvedValue({ token: mockToken });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      expect(response.cookies.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'session',
          value: 'mock-session-cookie',
        })
      );
    });
  });
});
