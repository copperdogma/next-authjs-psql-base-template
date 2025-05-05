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

// Mock server-only package
jest.mock('server-only', () => ({}), { virtual: true });

// Import the real services module - THIS IMPORT IS NOW MOCKED
// import { profileService } from '@/lib/server/services';
// Import revalidatePath
// import { revalidatePath } from 'next/cache';
// Import the type and the actual action function
import { NameUpdateState, updateUserName } from '@/app/profile/actions';
// import { auth } from '@/lib/auth-edge'; // No longer needed here if mocked below

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
    trace: jest.fn(), // Add trace mock
    child: jest.fn().mockReturnThis(),
  },
}));

// Mock lib/auth-edge (auto-mock)
jest.mock('@/lib/auth-edge');

// Now import the mocked function AFTER jest.mock
import { auth } from '@/lib/auth-edge';

// Assert the type of the imported mock
const mockedAuth = auth as jest.Mock;

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
    trace: jest.fn(), // Add trace mock
    child: jest.fn().mockReturnThis(),
  },
}));

// Mock lib/auth-edge
jest.mock('@/lib/auth-edge', () => ({
  auth: jest.fn(), // Mock the auth function directly
}));

// Import the mock accessor
// const { __getMockAuth } = require('@/lib/auth-node');
// Get reference to mocked logger
// const mockActionsLogger = require('@/lib/logger').logger;

describe('updateUserName Server Action', () => {
  let formData: FormData;
  let initialState: NameUpdateState;
  let mockUpdateUserName: jest.Mock; // Mock for profileService.updateUserName
  let mockRevalidate: jest.Mock; // Mock for revalidatePath

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up default mocks AFTER clearing
    mockUpdateUserName = jest.requireMock('@/lib/server/services').profileService.updateUserName;
    mockRevalidate = jest.requireMock('next/cache').revalidatePath;

    // Configure the imported mock function
    mockedAuth.mockClear();
    mockedAuth.mockResolvedValue({ user: { id: 'user-123' } }); // Default to authenticated

    // Setup common test data
    formData = new FormData();
    formData.set('name', 'New Valid Name');
    initialState = { message: '', success: false, updatedName: null };
  });

  it('should return error if user is not authenticated', async () => {
    // Override the auth mock for this specific test
    mockedAuth.mockResolvedValue(null); // Simulate no session

    const result = await updateUserName(initialState, formData);
    expect(result).toEqual({
      success: false,
      message: 'User not authenticated.',
      updatedName: null,
    });
    // Check the mocked service directly if profileService might be undefined
    const mockedService = require('@/lib/server/services').profileService;
    expect(mockedService?.updateUserName).not.toHaveBeenCalled();
  });

  it('should return error for invalid name (too short)', async () => {
    // Default mock is authenticated
    formData.set('name', 'N');
    const result = await updateUserName(initialState, formData);
    expect(result).toEqual({
      success: false,
      message: 'Name must be at least 3 characters long.',
      updatedName: null,
    });
    const mockedService = require('@/lib/server/services').profileService;
    expect(mockedService?.updateUserName).not.toHaveBeenCalled();
  });

  it('should return error for invalid name (too long)', async () => {
    formData.set('name', 'A'.repeat(51));
    const result = await updateUserName(initialState, formData);
    expect(result).toEqual({
      success: false,
      message: 'Name cannot exceed 50 characters.',
      updatedName: null,
    });
    expect(mockedAuth).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserName).not.toHaveBeenCalled();
  });

  it('should call profileService.updateUserName and return success on valid input', async () => {
    // Default mock is authenticated
    mockUpdateUserName.mockResolvedValue({ success: true });

    const result = await updateUserName(initialState, formData);

    expect(mockUpdateUserName).toHaveBeenCalledWith('user-123', 'New Valid Name');
    // Verify revalidatePath was called correctly
    expect(mockRevalidate).toHaveBeenCalledTimes(2);
    expect(mockRevalidate).toHaveBeenCalledWith('/profile');
    expect(mockRevalidate).toHaveBeenCalledWith('/');
    expect(result).toEqual({
      success: true,
      message: 'Name updated successfully',
      updatedName: 'New Valid Name',
    });
  });

  it('should return error message from profileService on failure', async () => {
    // Default mock is authenticated
    mockUpdateUserName.mockResolvedValue({ success: false, error: 'Service update failed' });

    const result = await updateUserName(initialState, formData);

    expect(mockUpdateUserName).toHaveBeenCalledWith('user-123', 'New Valid Name');
    expect(mockRevalidate).not.toHaveBeenCalled(); // Correct assertion
    expect(result).toEqual({
      success: false,
      message: 'Service update failed',
      updatedName: null,
    });
  });

  it('should return generic error on unexpected service exception', async () => {
    // Default mock is authenticated
    const error = new Error('Unexpected DB error');
    mockUpdateUserName.mockRejectedValue(error);

    const result = await updateUserName(initialState, formData);

    expect(mockUpdateUserName).toHaveBeenCalledWith('user-123', 'New Valid Name');
    expect(mockRevalidate).not.toHaveBeenCalled(); // Correct assertion
    expect(result).toEqual({
      success: false,
      message: 'Unexpected DB error',
      updatedName: null,
    });
  });
});
