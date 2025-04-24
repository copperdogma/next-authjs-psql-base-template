// Test file to reproduce the auth error in updateUserName action

// Mock lib/auth - define mock function inside the factory
jest.mock('@/lib/auth-node', () => {
  const mockAuth = jest.fn();
  return {
    auth: mockAuth,
    __esModule: true, // Indicate it's an ES module
    // Keep other mocks if needed, e.g., authConfig if actions imports it
    authConfig: {
      adapter: 'mocked-adapter',
      providers: [],
    },
    // Function to access the mock for configuration in tests
    __getMockAuth: () => mockAuth,
  };
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock any next/server dependencies that might be imported
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
    redirect: jest.fn(),
  },
}));

// Use relative paths for imports
import { updateUserName } from '../../../app/profile/actions';
import { FormState } from '../../../app/profile/actions';
// Import the mock accessor
const { __getMockAuth } = require('@/lib/auth-node');

describe('updateUserName action error handling', () => {
  it('should return an error when not authenticated', async () => {
    // Access the mock function via the accessor
    const mockAuth = __getMockAuth();
    // Mock auth to return null (unauthenticated)
    mockAuth.mockResolvedValue(null);

    // Create a simple FormData with a name
    const formData = new FormData();
    formData.append('name', 'Test Name');

    // Initial form state
    const initialState: FormState = {
      message: '',
      success: false,
    };

    // Call the action directly
    const result = await updateUserName(initialState, formData);

    // Since we mocked getServerSession to return null,
    // we expect an auth error message
    expect(result.success).toBe(false);
    expect(result.message).toBe('You must be logged in to update your profile');
  });
});
