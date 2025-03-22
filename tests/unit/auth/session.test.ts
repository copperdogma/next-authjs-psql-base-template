import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from '../../../app/api/auth/session/route';
import { adminAuth } from '../../../lib/firebase-admin';
import { prisma } from '../../../lib/prisma';

// Mock Firebase Admin Auth
jest.mock('../../../lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  const jsonMock = jest.fn().mockImplementation((data) => ({
    ...data,
    cookies: {
      set: jest.fn(),
    },
  }));
  
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jsonMock,
    },
  };
});

describe('Session API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/session', () => {
    it('should verify the token and create a session cookie with correct security settings', async () => {
      // Mock request data
      const mockToken = 'mock-firebase-token';
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ token: mockToken }),
      } as unknown as NextRequest;

      // Mock responses from Firebase
      const mockDecodedToken = { uid: 'user123', email: 'test@example.com', name: 'Test User' };
      const mockSessionCookie = 'mock-session-cookie';
      
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue(mockSessionCookie);
      
      // Mock Prisma responses
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session123', userId: 'user123' });

      // Call the API
      const response = await POST(mockRequest);

      // Verify token was checked
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      
      // Verify session cookie was created with correct expiration
      expect(adminAuth.createSessionCookie).toHaveBeenCalledWith(mockToken, expect.objectContaining({
        expiresIn: expect.any(Number),
      }));

      // Verify user was upserted
      expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { email: mockDecodedToken.email },
      }));

      // Verify session was created
      expect(prisma.session.create).toHaveBeenCalled();

      // Verify cookie was set with proper security settings
      expect(NextResponse.json).toHaveBeenCalled();
      expect(response.cookies.set).toHaveBeenCalledWith(expect.objectContaining({
        name: 'session',
        value: mockSessionCookie,
        httpOnly: true,
        path: '/',
      }));
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('should clear the session cookie', async () => {
      // Call the API
      const response = await DELETE();

      // Verify cookie was cleared
      expect(NextResponse.json).toHaveBeenCalled();
      expect(response.cookies.set).toHaveBeenCalledWith(expect.objectContaining({
        name: 'session',
        value: '',
        maxAge: 0,
        httpOnly: true,
      }));
    });
  });
}); 