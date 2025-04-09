// Mock the prisma module before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

// Mock next-auth getServerSession
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

// Mock revalidatePath function
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { updateUserName } from '@/app/profile/actions';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetServerSession = getServerSession as jest.Mock;

describe('updateUserName action', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the user name when valid input is provided', async () => {
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
    });

    // Mock database update
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      name: 'New Name',
    });

    // Create FormData with new name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify the database was called with correct parameters
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { name: 'New Name' },
    });

    // Verify revalidatePath was called
    expect(revalidatePath).toHaveBeenCalledWith('/profile');

    // Verify the result
    expect(result).toEqual({
      message: 'Name updated successfully',
      success: true,
    });
  });

  it('should return an error when name is empty', async () => {
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
    });

    // Create FormData with empty name
    const formData = new FormData();
    formData.append('name', '');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify database was not called
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    // Verify error result
    expect(result).toEqual({
      message: 'Name is required',
      success: false,
    });
  });

  it('should return an error when name is too long', async () => {
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
    });

    // Create FormData with too long name (51 characters)
    const formData = new FormData();
    formData.append('name', 'a'.repeat(51));

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify database was not called
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    // Verify error result
    expect(result).toEqual({
      message: 'Name is too long (maximum 50 characters)',
      success: false,
    });
  });

  it('should return an error when user is not authenticated', async () => {
    // Mock unauthenticated session
    mockGetServerSession.mockResolvedValue(null);

    // Create FormData
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify database was not called
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    // Verify error result
    expect(result).toEqual({
      message: 'You must be logged in to update your profile',
      success: false,
    });
  });

  it('should handle database errors', async () => {
    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
    });

    // Mock database error
    mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

    // Create FormData
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify error result
    expect(result).toEqual({
      message: 'An error occurred while updating your name',
      success: false,
    });
  });
});
