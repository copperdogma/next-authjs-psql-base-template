// Test file for revalidation in updateUserName action

// Mock next-auth imports
jest.mock('next-auth', () => {
  const originalModule = jest.requireActual('next-auth');
  return {
    ...originalModule,
    getServerSession: jest.fn(),
  };
});

jest.mock('next-auth/next', () => {
  return {
    NextAuth: jest.fn().mockReturnValue({
      handlers: {},
      auth: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    }),
  };
});

// Mock auth config
jest.mock('@/lib/auth', () => ({
  authConfig: {
    pages: {
      signIn: '/login',
    },
  },
}));

// Mock revalidatePath from next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Import functions and mocks
import { updateUserName } from '@/app/profile/actions';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

describe('updateUserName action revalidation', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call revalidatePath when update is successful', async () => {
    // Mock auth session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    // Mock database update
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      name: 'New Name',
    });

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    await updateUserName({ message: '', success: false }, formData);

    // Verify revalidatePath was called with the correct path
    expect(revalidatePath).toHaveBeenCalledWith('/profile');
  });

  it('should not call revalidatePath when validation fails', async () => {
    // Mock auth session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    // Create FormData with empty name (which will fail validation)
    const formData = new FormData();
    formData.append('name', '');

    // Call the action
    await updateUserName({ message: '', success: false }, formData);

    // Verify database was not updated
    expect(prisma.user.update).not.toHaveBeenCalled();

    // Verify revalidatePath was not called
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should not call revalidatePath when database update fails', async () => {
    // Mock auth session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    // Mock database error
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    await updateUserName({ message: '', success: false }, formData);

    // Verify revalidatePath was not called due to error
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
