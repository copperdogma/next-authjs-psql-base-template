import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { pino } from 'pino';
import type { PrismaClient, User as PrismaUser } from '@prisma/client';
import { UserService } from '../../../lib/services/user-service';

// Mocks
const mockLogger = mockDeep<pino.Logger>();
// We need to mock the PrismaClient instance and its delegate (`user`)
const mockPrismaUserDelegate = mockDeep<PrismaClient['user']>();
const mockPrismaClient = mockDeep<PrismaClient>();

// Helper to create a mock Prisma User (can be reused or moved to a shared test util)
const createMockUser = (overrides: Partial<PrismaUser>): PrismaUser => ({
  id: 'default-id',
  name: 'Default Name',
  email: 'default@example.com',
  emailVerified: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockPrismaClient);
    mockReset(mockPrismaUserDelegate);

    // Link the mocked delegate to the mocked client instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockPrismaClient.user as any) = mockPrismaUserDelegate;

    userService = new UserService(mockPrismaClient, mockLogger);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  // --- Test findUserById ---
  describe('findUserById', () => {
    const userId = 'user-123';

    it('should call prisma.user.findUnique and log debug on success', async () => {
      const mockUser = createMockUser({ id: userId });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      const user = await userService.findUserById(userId);

      expect(user).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      // Check for debug logs based on actual implementation
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'Finding user by ID'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ userId, found: true }),
        'User found by ID'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null and log when user is not found', async () => {
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      const user = await userService.findUserById(userId);

      expect(user).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'Finding user by ID'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ userId, found: false }),
        'User found by ID'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error if prisma call fails', async () => {
      const dbError = new Error('DB lookup failed');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      await expect(userService.findUserById(userId)).rejects.toThrow(dbError);

      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ userId, error: dbError.message }),
        'Error finding user by ID'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        'Finding user by ID' // Still logs the attempt
      );
    });
  });

  // --- Test findUserByEmail ---
  describe('findUserByEmail', () => {
    const email = 'test@example.com';

    it('should call prisma.user.findUnique and log debug on success', async () => {
      const mockUser = createMockUser({ email: email });
      mockPrismaUserDelegate.findUnique.mockResolvedValue(mockUser);

      const user = await userService.findUserByEmail(email);

      expect(user).toEqual(mockUser);
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: email },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ email }),
        'Finding user by email'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ email, found: true }),
        'User found by email'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null and log when user is not found by email', async () => {
      mockPrismaUserDelegate.findUnique.mockResolvedValue(null);

      const user = await userService.findUserByEmail(email);

      expect(user).toBeNull();
      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: email },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ email }),
        'Finding user by email'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ email, found: false }),
        'User found by email'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error if prisma call fails', async () => {
      const dbError = new Error('DB email lookup failed');
      mockPrismaUserDelegate.findUnique.mockRejectedValue(dbError);

      await expect(userService.findUserByEmail(email)).rejects.toThrow(dbError);

      expect(mockPrismaUserDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: email },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ email, error: dbError.message }),
        'Error finding user by email'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ email }),
        'Finding user by email' // Still logs the attempt
      );
    });
  });

  // --- Test updateUserName ---
  describe('updateUserName', () => {
    const userId = 'user-456';
    const name = 'Updated Name Again';

    it('should call prisma.user.update and log info on success', async () => {
      const updatedUser = createMockUser({ id: userId, name: name });
      mockPrismaUserDelegate.update.mockResolvedValue(updatedUser);

      const user = await userService.updateUserName(userId, name);

      expect(user).toEqual(updatedUser);
      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }), // Updated based on implementation
        'Updating user name'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }), // Updated based on implementation
        'User name updated successfully'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle error when updating a non-existent user', async () => {
      const nonExistentError = new Error('Record to update not found.');
      mockPrismaUserDelegate.update.mockRejectedValue(nonExistentError);

      await expect(userService.updateUserName('non-existent-id', name)).rejects.toThrow(
        nonExistentError
      );

      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        data: { name },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'non-existent-id',
          error: nonExistentError.message,
        }),
        'Error updating user name'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'non-existent-id' }),
        'Updating user name'
      );
    });

    it('should log error if update fails', async () => {
      const updateError = new Error('Update failed');
      mockPrismaUserDelegate.update.mockRejectedValue(updateError);

      await expect(userService.updateUserName(userId, name)).rejects.toThrow(updateError);

      expect(mockPrismaUserDelegate.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ userId, error: updateError.message }), // Updated based on implementation
        'Error updating user name'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ userId }), // Updated based on implementation
        'Updating user name' // Still logs the attempt
      );
    });
  });
});
