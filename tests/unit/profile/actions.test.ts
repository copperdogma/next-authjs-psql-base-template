// Test file for profile actions

// Mock server services *before* importing anything that might use them
jest.mock('@/lib/server/services', () => ({
  profileService: {
    updateUserName: jest.fn(), // Mock the specific method used by the action
  },
  // Add mocks for other services if needed by the action or its imports
  firebaseAdminService: {
    /* Mock methods if needed */
  },
  userService: {
    /* Mock methods if needed */
  },
}));

// Import the real services module - THIS IMPORT IS NOW MOCKED
import { profileService } from '../../../lib/server/services';
// Import revalidatePath
import { revalidatePath } from 'next/cache';
// Import the function we're testing
import { updateUserName, UpdateUserNameFormState } from '../../../app/profile/actions'; // Add FormState import

// Mock lib/auth - define mock function inside the factory
jest.mock('@/lib/auth-node', () => {
  const mockAuth = jest.fn();
  return {
    auth: mockAuth,
    __esModule: true, // Indicate it's an ES module
    // Function to access the mock for configuration in tests
    __getMockAuth: () => mockAuth,
  };
});

// Mock revalidatePath from next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock the root logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(), // Mock child to return the mock itself
  },
}));

// Import the mock accessor
const { __getMockAuth } = require('@/lib/auth-node');
// Get reference to mocked logger
const mockActionsLogger = require('@/lib/logger').logger;

describe('updateUserName action', () => {
  // Access the mocked service method directly
  const mockUpdateUserName = profileService.updateUserName as jest.Mock;
  const mockAuth = __getMockAuth();
  let initialState: UpdateUserNameFormState;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    // Add role if needed by auth logic internally, assuming string for simplicity here
    // role: UserRole.USER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUserName.mockClear();
    mockAuth.mockClear();
    mockAuth.mockResolvedValue({ user: mockUser }); // Default to authenticated
    initialState = { message: '', success: false };
  });

  it('should update user name when authenticated and input is valid', async () => {
    // Arrange
    mockUpdateUserName.mockResolvedValue({ success: true });
    const formData = new FormData();
    const newName = 'New Valid Name';
    formData.append('name', newName);

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).toHaveBeenCalledWith(mockUser.id, newName);
    expect(revalidatePath).toHaveBeenCalledWith('/profile');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(result).toEqual({
      message: 'Name updated successfully',
      success: true,
      updatedName: newName,
    });
    expect(mockActionsLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'User name updated successfully' })
    );
  });

  it('should return error when user is not authenticated', async () => {
    // Arrange
    mockAuth.mockResolvedValue(null); // Not logged in
    const formData = new FormData();
    formData.append('name', 'New Name');

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'You must be logged in to update your profile',
      success: false,
      updatedName: null,
    });
    expect(mockActionsLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'User not authenticated in verifyAuthentication',
      })
    );
  });

  it('should return error for name too short', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('name', 'A');

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    // Check for specific message from Zod error handling
    expect(result.message).toBe('Name is required');
    expect(mockActionsLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Invalid user name' })
    );
  });

  it('should return error for name too long', async () => {
    // Arrange
    const formData = new FormData();
    const longName = 'a'.repeat(51);
    formData.append('name', longName);

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Name is too long (maximum 50 characters)');
    expect(mockActionsLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Invalid user name' })
    );
  });

  it('should return error if auth() itself throws', async () => {
    // Arrange
    const authError = new Error('Auth Service Unavailable');
    mockAuth.mockRejectedValue(authError);
    const formData = new FormData();
    formData.append('name', 'Valid Name');

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Authentication check failed');
    expect(mockActionsLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: authError }),
      'Error during authentication verification'
    );
  });

  it('should return error if profile service fails', async () => {
    // Arrange
    const serviceErrorMsg = 'Database connection lost';
    mockUpdateUserName.mockResolvedValue({ success: false, error: serviceErrorMsg });
    const formData = new FormData();
    const validName = 'Valid Name';
    formData.append('name', validName);

    // Act
    const result = await updateUserName(initialState, formData);

    // Assert
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).toHaveBeenCalledWith(mockUser.id, validName);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe(serviceErrorMsg);
    expect(mockActionsLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        name: validName,
        error: serviceErrorMsg,
      }),
      'Profile service failed to update user name'
    );
  });
});
