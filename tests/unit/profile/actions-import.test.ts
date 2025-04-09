// Test file for updated import pattern in updateUserName action

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock lib/auth
jest.mock('@/lib/auth', () => ({
  authConfig: {
    adapter: 'mocked-adapter',
    providers: [],
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

// Import functions and mocks
import { updateUserName } from '@/app/profile/actions';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

describe('updateUserName action with updated import pattern', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use getServerSession correctly', async () => {
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
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify getServerSession was called
    expect(getServerSession).toHaveBeenCalled();

    // Verify database was updated
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { name: 'New Name' },
    });

    // Verify successful result
    expect(result).toEqual({
      message: 'Name updated successfully',
      success: true,
    });
  });
});
