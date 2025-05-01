/**
 * @jest-environment node
 */
import {
  describe,
  expect,
  it,
  jest,
  beforeEach /*, afterEach // Removed unused */,
} from '@jest/globals';
import { ProfileService } from '../../../lib/services/profile-service';
import { UserService } from '../../../lib/services/user-service';
import { FirebaseAdminService } from '../../../lib/services/firebase-admin-service';
// @ts-ignore - TODO: Investigate Prisma type resolution issue
import { User as PrismaUser, UserRole } from '@prisma/client';
// @ts-ignore - TODO: Investigate Firebase type resolution issue
import type { UserRecord } from 'firebase-admin/auth';
import { Logger } from 'pino';

// Mocks
jest.mock('../../../lib/services/user-service');
jest.mock('../../../lib/services/firebase-admin-service');

// Mock Logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  level: 'info',
  child: jest.fn().mockReturnThis(),
} as unknown as Logger;

jest.mock('@/lib/logger', () => ({
  logger: mockLogger,
  loggers: {
    profile: mockLogger,
  },
}));

// Helper to create mock PrismaUser
const createMockUser = (overrides: Partial<PrismaUser> = {}): PrismaUser => ({
  id: 'default-id',
  name: 'Default Name',
  email: 'default@example.com',
  emailVerified: new Date(),
  image: null,
  hashedPassword: null,
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  // @ts-ignore - Allow overriding parts of the mock
  ...overrides,
});

// Helper to create mock Firebase UserRecord
const createMockFirebaseUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  uid: 'firebase-uid',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  // Add other necessary UserRecord properties with default mock values
  photoURL: null,
  phoneNumber: null,
  disabled: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
    lastRefreshTime: null,
  },
  providerData: [],
  passwordHash: null,
  passwordSalt: null,
  tokensValidAfterTime: null,
  tenantId: null,
  toJSON: () => ({ ...createMockFirebaseUser(overrides) }), // Simple JSON representation
  ...overrides,
});

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockUserService: jest.Mocked<UserService>;
  let mockFirebaseAdminService: jest.Mocked<FirebaseAdminService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock implementations for UserService
    mockUserService = {
      findUserById: jest.fn(),
      updateUserName: jest.fn(),
    } as any;

    // Create mock for FirebaseAdminService
    mockFirebaseAdminService = {
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    } as any;

    // Set up profileService with mocked dependencies and logger
    profileService = new ProfileService(mockUserService, mockFirebaseAdminService, mockLogger);
  });

  describe('updateUserName', () => {
    const userId = 'user-123';
    const name = 'New Name';
    const email = 'user@example.com';
    const mockDbUser = createMockUser({ id: userId, email: email });
    const mockFbUser = createMockFirebaseUser({ uid: 'fb-uid-for-user-123', email: email });
    const firebaseError = new Error('Firebase error');

    it('should update name in DB and Firebase successfully', async () => {
      mockUserService.findUserById.mockResolvedValue(mockDbUser);
      mockFirebaseAdminService.getUserByEmail.mockResolvedValue(mockFbUser);
      mockFirebaseAdminService.updateUser.mockResolvedValue(createMockFirebaseUser());
      mockUserService.updateUserName.mockResolvedValue(createMockUser({ id: userId, name }));

      const result = await profileService.updateUserName(userId, name);

      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockFirebaseAdminService.updateUser).toHaveBeenCalledWith(mockFbUser.uid, {
        displayName: name,
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should update DB only if user has no email', async () => {
      const userWithoutEmail = createMockUser({ id: userId, email: null });
      mockUserService.findUserById.mockResolvedValue(userWithoutEmail);
      mockUserService.updateUserName.mockResolvedValue(
        createMockUser({ id: userId, name, email: null })
      );

      const result = await profileService.updateUserName(userId, name);

      expect(result).toEqual({ success: true });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockFirebaseAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should update DB only and log error if Firebase getUserByEmail fails', async () => {
      mockUserService.findUserById.mockResolvedValue(mockDbUser);
      mockFirebaseAdminService.getUserByEmail.mockRejectedValue(firebaseError);
      mockUserService.updateUserName.mockResolvedValue(createMockUser({ id: userId, name }));

      const result = await profileService.updateUserName(userId, name);

      expect(result).toEqual({ success: true }); // Still succeeds overall
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockFirebaseAdminService.updateUser).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should update DB only and log error if Firebase updateUser fails', async () => {
      mockUserService.findUserById.mockResolvedValue(mockDbUser);
      mockFirebaseAdminService.getUserByEmail.mockResolvedValue(mockFbUser);
      mockFirebaseAdminService.updateUser.mockRejectedValue(firebaseError);
      mockUserService.updateUserName.mockResolvedValue(createMockUser({ id: userId, name }));

      const result = await profileService.updateUserName(userId, name);

      expect(result).toEqual({ success: true }); // Still succeeds overall
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockFirebaseAdminService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockFirebaseAdminService.updateUser).toHaveBeenCalledWith(mockFbUser.uid, {
        displayName: name,
      });
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should return error if DB update fails', async () => {
      const dbError = new Error('DB update failed');
      mockUserService.updateUserName.mockRejectedValue(dbError);

      const result = await profileService.updateUserName(userId, name);

      expect(result).toEqual({ success: false, error: 'DB update failed' });
      expect(mockUserService.updateUserName).toHaveBeenCalledWith(userId, name);
      expect(mockUserService.findUserById).not.toHaveBeenCalled();
      expect(mockFirebaseAdminService.getUserByEmail).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
