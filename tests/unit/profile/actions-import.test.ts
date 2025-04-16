// Test file for profile actions using jest.spyOn

// Import next-auth functions we'll mock
import { getServerSession } from 'next-auth';
// Import the real services module
import { profileService } from '../../../lib/server/services';
// Import revalidatePath
import { revalidatePath } from 'next/cache';
// Import the function we're testing
import { updateUserName } from '../../../app/profile/actions';

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

describe('updateUserName action with jest.spyOn pattern', () => {
  // Create a spy on the profileService.updateUserName method
  const mockUpdateUserName = jest.spyOn(profileService, 'updateUserName');

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the spy
    mockUpdateUserName.mockClear();
  });

  it('should update user name when authenticated', async () => {
    // Mock auth session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    // Mock the profile service method using the spy
    mockUpdateUserName.mockResolvedValue({ success: true });

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify getServerSession was called
    expect(getServerSession).toHaveBeenCalled();

    // Verify profileService.updateUserName was called with correct parameters
    expect(mockUpdateUserName).toHaveBeenCalledWith(mockUser.id, 'New Name');

    // Verify revalidatePath was called
    expect(revalidatePath).toHaveBeenCalledWith('/profile');

    // Verify successful result
    expect(result).toEqual({
      message: 'Name updated successfully',
      success: true,
    });
  });

  it('should return error when user is not authenticated', async () => {
    // Mock auth session - user not logged in
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify getServerSession was called
    expect(getServerSession).toHaveBeenCalled();

    // Verify profileService.updateUserName was NOT called
    expect(mockUpdateUserName).not.toHaveBeenCalled();

    // Verify result has error
    expect(result).toEqual({
      message: 'You must be logged in to update your profile',
      success: false,
    });
  });
});
