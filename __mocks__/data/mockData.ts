import { User } from '@prisma/client';
import { Session } from 'next-auth';

export const mockUser: User = {
  id: 'clmockuser123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: new Date('2023-01-01T10:00:00Z'),
  image: null,
  hashedPassword: null, // Or a mock hash if needed for specific tests
  role: 'USER',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  lastSignedInAt: new Date('2023-01-15T12:00:00Z'),
};

export const mockSession: Session = {
  user: {
    ...mockUser, // Spread all properties from mockUser
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 1 day
};
