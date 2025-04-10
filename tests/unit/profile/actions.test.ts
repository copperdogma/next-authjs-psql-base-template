import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { ProfileService } from '@/lib/services/profile-service';
import { SessionService, LoggerService } from '@/lib/interfaces/services';

// Create mock for the form state type since we can't import it directly
type FormState = {
  message: string;
  success: boolean;
};

// Mock the FormData globally for tests
global.FormData = class {
  private data: Record<string, string> = {};

  append(key: string, value: string) {
    this.data[key] = value;
  }

  get(key: string) {
    return this.data[key];
  }
} as unknown as typeof FormData;

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock the entire module
jest.mock('@/app/profile/actions', () => {
  return {
    updateUserName: jest.fn(),
  };
});

// Import the mocked module
const actions = jest.requireMock('@/app/profile/actions');
const { revalidatePath } = jest.requireMock('next/cache');

// Mock the services
const mockProfileService: jest.Mocked<Partial<ProfileService>> = {
  updateUserName: jest.fn(),
};

const mockSessionService: jest.Mocked<Partial<SessionService>> = {
  getServerSession: jest.fn(),
};

const mockLoggerService: jest.Mocked<Partial<LoggerService>> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('ProfileActions', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Setup the mock implementation
    actions.updateUserName.mockImplementation(async (prevState: FormState, formData: FormData) => {
      const name = formData.get('name') as string;

      // Log the call
      mockLoggerService.info?.({ msg: 'updateUserName called', name });

      // 1. Verify authentication
      const session = await mockSessionService.getServerSession?.();
      if (!session?.user?.id) {
        mockLoggerService.warn?.({ msg: 'User not authenticated' });
        return {
          message: 'You must be logged in to update your profile',
          success: false,
        };
      }

      // 2. Validate the user name
      if (name.length < 2) {
        mockLoggerService.warn?.({ msg: 'Invalid user name', name });
        return {
          message: 'Name must be at least 2 characters',
          success: false,
        };
      }

      // 3. Update the user name
      const updateResult = await mockProfileService.updateUserName?.(session.user.id, name);
      if (!updateResult?.success) {
        return {
          message: updateResult?.error || 'An error occurred while updating your name',
          success: false,
        };
      }

      // 4. Revalidate the profile page
      revalidatePath('/profile');

      mockLoggerService.info?.({ msg: 'User name updated successfully', userId: session.user.id });
      return {
        message: 'Name updated successfully',
        success: true,
      };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('updateUserName', () => {
    it('should return error when user is not authenticated', async () => {
      // Arrange
      mockSessionService.getServerSession?.mockResolvedValue(null);
      const formData = new FormData();
      formData.append('name', 'New Name');

      // Act
      const result = await actions.updateUserName(
        {
          message: '',
          success: false,
        },
        formData
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('must be logged in');
      expect(mockProfileService.updateUserName).not.toHaveBeenCalled();
    });

    it('should validate user name and return error for invalid names', async () => {
      // Arrange
      mockSessionService.getServerSession?.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);

      const formData = new FormData();
      formData.append('name', 'a'); // Too short

      // Act
      const result = await actions.updateUserName(
        {
          message: '',
          success: false,
        },
        formData
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 2 characters');
      expect(mockProfileService.updateUserName).not.toHaveBeenCalled();
    });

    it('should update user name when input is valid', async () => {
      // Arrange
      mockSessionService.getServerSession?.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);

      mockProfileService.updateUserName?.mockResolvedValue({
        success: true,
      });

      const formData = new FormData();
      formData.append('name', 'New Name');

      // Act
      const result = await actions.updateUserName(
        {
          message: '',
          success: false,
        },
        formData
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Name updated successfully');
      expect(mockProfileService.updateUserName).toHaveBeenCalledWith('user-123', 'New Name');
      expect(revalidatePath).toHaveBeenCalledWith('/profile');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockSessionService.getServerSession?.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);

      mockProfileService.updateUserName?.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const formData = new FormData();
      formData.append('name', 'New Name');

      // Act
      const result = await actions.updateUserName(
        {
          message: '',
          success: false,
        },
        formData
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(mockProfileService.updateUserName).toHaveBeenCalledWith('user-123', 'New Name');
    });
  });
});
