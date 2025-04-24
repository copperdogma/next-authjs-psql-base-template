// Test file for profile actions using jest.spyOn

// Remove unused import
// Import the real services module
import { profileService } from '../../../lib/server/services';
// Import revalidatePath
import { revalidatePath } from 'next/cache';
// Import the function we're testing
import { updateUserName } from '../../../app/profile/actions';

// Remove mock for next-auth

// Mock lib/auth - define mock function inside the factory
jest.mock('@/lib/auth-node', () => {
  const mockAuth = jest.fn();
  return {
    auth: mockAuth,
    __esModule: true, // Indicate it's an ES module
    // Keep other mocks if needed
    authConfig: {
      adapter: 'mocked-adapter',
      providers: [],
    },
    // Function to access the mock for configuration in tests
    __getMockAuth: () => mockAuth,
  };
});

// Mock revalidatePath from next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Import the mock accessor
const { __getMockAuth } = require('@/lib/auth-node');

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
    // Access the mock function via the accessor
    const mockAuth = __getMockAuth();
    // Mock auth session using the mockAuth function
    mockAuth.mockResolvedValue({
      user: mockUser, // Use the existing mockUser object
    });

    // Mock the profile service method using the spy
    mockUpdateUserName.mockResolvedValue({ success: true });

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify mockAuth was called
    expect(mockAuth).toHaveBeenCalled();

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
    // Access the mock function via the accessor
    const mockAuth = __getMockAuth();
    // Mock auth session - user not logged in by returning null from mockAuth
    mockAuth.mockResolvedValue(null);

    // Create FormData with name
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Call the action
    const result = await updateUserName({ message: '', success: false }, formData);

    // Verify mockAuth was called
    expect(mockAuth).toHaveBeenCalled();

    // Verify profileService.updateUserName was NOT called
    expect(mockUpdateUserName).not.toHaveBeenCalled();

    // Verify result has error
    expect(result).toEqual({
      message: 'You must be logged in to update your profile',
      success: false,
    });
  });
});
