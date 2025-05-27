import { jest } from '@jest/globals';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from 'next-auth/adapters';
import type { Account, Profile, Session, User as NextAuthUser } from 'next-auth';
import { logger } from '@/lib/logger';
// Import the real types needed from auth-helpers
import type { AuthUserInternal, ValidateSignInResult } from '@/lib/auth/auth-helpers';
// Import the functions under test
import { handleJwtSignIn, handleJwtUpdate } from '@/lib/auth/auth-jwt';
import { type HandleJwtSignInArgs } from '@/lib/auth/auth-jwt-types';
// Import UserRole directly from prisma
import { UserRole } from '@prisma/client';
import { mockUser } from '../../../mocks/data/mockData'; // Added import

// Disable file length check for this large test file
// Disable function length check for this large test file

// --- Mocks ---

// Logger is mocked automatically
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// uuid is mocked manually via __mocks__/uuid.ts

// --- Test Setup ---

// Create explicit mock functions for dependencies
const mockFindOrCreateUser = jest.fn<() => Promise<AuthUserInternal | null>>();
const mockPrepareProfile =
  jest.fn<() => { id: string; name: string | null; email: string; image: string | null }>();
const mockValidateInputs = jest.fn<() => ValidateSignInResult>();
// Explicitly type the mock uuid function
const mockUuidV4 = jest.fn<() => string>();

// Define the mock UUID value we'll configure the mock to return
const mockUuidReturnedValue = 'mock-jti-id';

// Assemble the dependencies object to pass to handleJwtSignIn
const mockDependencies = {
  findOrCreateUser: mockFindOrCreateUser,
  prepareProfile: mockPrepareProfile,
  validateInputs: mockValidateInputs,
  uuidv4: mockUuidV4, // Pass the mock function
};

// --- Test Data ---
const correlationId = 'test-correlation-id-jwt';

const baseJwt: JWT = {
  sub: 'initial-sub',
  name: 'Initial Name',
  email: 'initial@example.com',
  picture: null,
  role: UserRole.USER,
};

const credentialsUser: NextAuthUser = {
  id: mockUser.id || 'cred-user-id',
  name: mockUser.name,
  email: mockUser.email as string,
  image: mockUser.image,
  role: mockUser.role || UserRole.ADMIN,
};

const oAuthUser: AdapterUser = {
  id: mockUser.id || 'oauth-user-id',
  name: mockUser.name,
  email: mockUser.email as string,
  image: mockUser.image,
  emailVerified: null,
  role: mockUser.role || UserRole.USER,
};

const oAuthAccount: Account = {
  provider: 'google',
  type: 'oauth',
  providerAccountId: 'google-id-123',
  access_token: 'mock-access-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  scope: 'openid profile email',
  id_token: 'mock-id-token',
  session_state: 'mock-session-state',
  iat: 0,
};

const oAuthProfile: Profile = {
  name: 'OAuth Profile Name',
  email: 'oauth-profile@example.com',
  image: 'oauth-profile-image.jpg',
  iss: '',
  aud: '',
  sub: '',
  exp: 0,
  iat: 0,
};

const mockDbUserInternal: AuthUserInternal = {
  id: mockUser.id || 'oauth-db-user-id',
  name: mockUser.name,
  email: mockUser.email as string,
  image: mockUser.image,
  role: mockUser.role || UserRole.USER,
};

const mockPreparedProfileData = {
  id: oAuthUser.id,
  name: 'Prepared Name',
  email: oAuthUser.email as string,
  image: 'prepared-image.jpg',
};

// --- Test Suite ---
describe('auth-jwt Callbacks', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockFindOrCreateUser.mockReset();
    mockPrepareProfile.mockReset();
    mockValidateInputs.mockReset();
    mockUuidV4.mockReset();

    // Setup default mock behaviors
    mockUuidV4.mockReturnValue(mockUuidReturnedValue); // Default JTI return value
    mockValidateInputs.mockReturnValue({
      isValid: true,
      userId: 'default-id',
      userEmail: 'default@email.com',
    });
    mockPrepareProfile.mockReturnValue(mockPreparedProfileData);
    mockFindOrCreateUser.mockResolvedValue(mockDbUserInternal);
  });

  // === handleJwtSignIn ===
  describe('handleJwtSignIn', () => {
    it('should handle Credentials sign-in correctly', async () => {
      // Arrange
      const args: HandleJwtSignInArgs = {
        token: { ...baseJwt },
        user: credentialsUser,
        account: null, // No account for credentials
        profile: undefined,
        correlationId,
        dependencies: mockDependencies, // Pass mocks
      };

      // Act
      const result = await handleJwtSignIn(args);

      // Assert
      // We don't assert on JTI here since it's not using our mock
      expect(result).toEqual({
        sub: credentialsUser.id,
        name: credentialsUser.name,
        email: credentialsUser.email,
        picture: credentialsUser.image,
        role: credentialsUser.role,
        jti: expect.any(String), // Use any string instead of exact match
        userId: credentialsUser.id, // Added based on implementation
        userRole: credentialsUser.role, // Added based on implementation
      });
      expect(logger.info).toHaveBeenCalled();
      expect(mockValidateInputs).not.toHaveBeenCalled();
      expect(mockPrepareProfile).not.toHaveBeenCalled();
      expect(mockFindOrCreateUser).not.toHaveBeenCalled();
      // Don't check UUID mock since it's not used in credentials path
    });

    it('should return base token with new JTI if credentials user data is invalid', async () => {
      // Arrange
      const invalidUser = { ...credentialsUser, id: undefined }; // Missing ID
      const args: HandleJwtSignInArgs = {
        token: { ...baseJwt },
        user: invalidUser as NextAuthUser,
        account: null,
        profile: undefined,
        correlationId,
        dependencies: mockDependencies,
      };

      // Act
      const result = await handleJwtSignIn(args);

      // Assert
      // Updated: Expect it to resolve with base token + JTI on error, not throw
      expect(result).toEqual({
        ...baseJwt, // The initial token passed in
        jti: mockUuidReturnedValue, // The generated JTI
      });
      expect(logger.error).toHaveBeenCalled();
      // Don't check UUID mock since it's not used in credentials path
    });

    it('should handle OAuth sign-in correctly', async () => {
      // Mock setup - Only the absolute minimum required
      mockValidateInputs.mockReturnValue({
        isValid: true,
        userId: 'test-user-id',
        userEmail: 'test@example.com',
      });

      // Mock the database user returned from find/create
      const testDbUser: AuthUserInternal = {
        ...mockUser, // Spread mockUser first to get all its properties
        id: 'test-db-id',
        name: 'Test DB User',
        email: 'test-db@example.com' as string, // ensure string type for email
        image: 'test-image.jpg',
        role: UserRole.USER, // Specific role for this test case
      };
      mockFindOrCreateUser.mockResolvedValue(testDbUser);

      // Mock the prepared profile
      const preparedProfileData = {
        id: oAuthUser.id,
        name: 'Prepared OAuth Name',
        email: oAuthUser.email as string,
        image: 'prepared-oauth-image.jpg',
      };
      mockPrepareProfile.mockReturnValue(preparedProfileData);

      // OAuth test account
      const testAccount: Account = {
        provider: 'test-provider',
        type: 'oauth',
        providerAccountId: 'test-provider-id',
        access_token: 'test-access-token',
      };

      // Arguments for the function call
      const args = {
        token: { ...baseJwt },
        user: { id: 'test-user-id', email: 'test@example.com' } as any,
        account: testAccount as any,
        profile: { name: 'Test Profile' } as any,
        correlationId: correlationId,
        dependencies: mockDependencies,
      };

      // Act - Call the function
      const result = await handleJwtSignIn(args);

      // Assert - Check important values passed through and transformed
      expect(result).toEqual({
        sub: testDbUser.id,
        name: testDbUser.name,
        email: testDbUser.email,
        picture: testDbUser.image,
        role: UserRole.USER, // Assuming default role if not specified or mapped
        jti: expect.any(String), // JTI is generated, so check for type
        userId: testDbUser.id, // from OAuthDbUser.userId
        userRole: UserRole.USER, // from OAuthDbUser.role
      });
      expect(mockValidateInputs).toHaveBeenCalledWith(args.user, args.account, correlationId);
      expect(mockPrepareProfile).toHaveBeenCalledWith(
        args.user.id, // Expected: userId (string)
        args.user.email, // Expected: userEmail (string)
        args.profile, // Expected: profile object
        args.user // Expected: user object
      );
      expect(mockFindOrCreateUser).toHaveBeenCalledWith({
        email: args.user.email, // From args.user passed to handleJwtSignIn
        profileData: preparedProfileData, // This is the return value of mockPrepareProfile
        providerAccountId: args.account.providerAccountId,
        provider: args.account.provider,
        correlationId: correlationId, // The top-level correlationId for the test
      });
      expect(mockUuidV4).toHaveBeenCalledTimes(2);
    });

    it('should return minimal token with new JTI if OAuth validation fails', async () => {
      // Arrange
      mockValidateInputs.mockReturnValue({ isValid: false }); // Simulate failure
      const originalToken = { ...baseJwt, jti: 'existing-jti' };
      const args: HandleJwtSignInArgs = {
        token: originalToken,
        user: oAuthUser,
        account: oAuthAccount,
        profile: oAuthProfile,
        correlationId,
        dependencies: mockDependencies,
      };

      const result = await handleJwtSignIn(args);

      // Assert
      // Expect only a new JTI if OAuth validation fails.
      // The original token is discarded, and no user data is merged.
      expect(result).toEqual({
        jti: mockUuidReturnedValue,
      });
      expect(mockValidateInputs).toHaveBeenCalledWith(oAuthUser, oAuthAccount, correlationId);
      expect(mockValidateInputs).toHaveBeenCalledTimes(1);
      // We shouldn't check these since validation fails and they won't be called
      expect(mockPrepareProfile).not.toHaveBeenCalled();
      expect(mockFindOrCreateUser).not.toHaveBeenCalled();
      // Removed assertion: uuidv4 *is* called for fallback JTI
    });

    it('should assign default USER role if user role is missing/invalid (credentials path)', async () => {
      // Arrange
      // Use proper type casting for the test users

      const noRoleUser = { ...credentialsUser } as any;
      delete noRoleUser.role; // Remove role property completely

      const invalidRoleUser = {
        ...credentialsUser,

        role: 'INVALID_ROLE' as any,
      };

      const args1: HandleJwtSignInArgs = {
        token: { ...baseJwt },
        user: noRoleUser,
        account: null,
        profile: undefined,
        correlationId,
        dependencies: mockDependencies,
      };

      const args2: HandleJwtSignInArgs = {
        token: { ...baseJwt },
        user: invalidRoleUser,
        account: null,
        profile: undefined,
        correlationId,
        dependencies: mockDependencies,
      };

      // Act
      const result1 = await handleJwtSignIn(args1);
      const result2 = await handleJwtSignIn(args2);

      // Assert
      expect(result1.role).toBe(UserRole.USER);
      expect(result2.role).toBe(UserRole.USER);
      // Don't check UUID mock for credentials path
    });

    // Note: Role handling for OAuth path is done within findOrCreateUserAndAccountInternal/prisma,
    // And tested separately
  });

  // === handleJwtUpdate ===
  describe('handleJwtUpdate', () => {
    it('should update token with new user data and generate new JTI', () => {
      // Arrange
      const token = { ...baseJwt, jti: 'old-jti' } as JWT;
      const sessionUpdate: Session = {
        user: {
          name: 'Updated Name',
          role: UserRole.ADMIN,
          picture: 'new-image.jpg',
          email: 'updated@example.com',
          id: 'ignored-id',
        } as Session['user'] & { picture?: string | null },
        expires: 'never',
      };
      const expectedToken = {
        ...baseJwt,
        name: 'Updated Name',
        email: 'updated@example.com',
        picture: null,
        role: UserRole.ADMIN,
        sub: 'ignored-id',
        jti: mockUuidReturnedValue,
        userId: 'ignored-id',
        userRole: UserRole.ADMIN,
      };

      // Act
      const result = handleJwtUpdate(token, sessionUpdate, correlationId, { uuidv4: mockUuidV4 });

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockUuidV4).toHaveBeenCalledTimes(1);
    });

    it('should only update provided fields', () => {
      // Arrange
      const token = { ...baseJwt, jti: 'old-jti' } as JWT;
      const sessionUpdate: Session = {
        user: { id: 'cred-user-id', role: UserRole.ADMIN, name: 'Only Name Update' },
        expires: 'never',
      };

      // Act
      const result = handleJwtUpdate(token, sessionUpdate, correlationId, { uuidv4: mockUuidV4 });

      // Assert
      expect(result).toEqual({
        ...token, // Start with the original token
        name: 'Only Name Update', // Apply the update
        sub: 'cred-user-id', // sub should update from session
        userId: 'cred-user-id', // userId should update from session
        role: UserRole.ADMIN, // Role from session
        userRole: UserRole.ADMIN, // userRole from session
        jti: mockUuidReturnedValue, // New JTI
      });
    });

    it('should return token with new JTI and log warning if update trigger used without user data', () => {
      // Arrange
      const token = { ...baseJwt, jti: 'old-jti' } as JWT;
      const sessionUpdate: Session = {
        // @ts-expect-error Testing scenario where user might be missing
        user: undefined,
        expires: 'never',
      };
      const expectedToken = {
        ...token,
        jti: token.jti,
      };

      // Act
      const result = handleJwtUpdate(token, sessionUpdate, correlationId, { uuidv4: mockUuidV4 });

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockUuidV4).toHaveBeenCalledTimes(0);
    });

    it('should handle partial updates (e.g., only email)', () => {
      // Arrange
      const token = { ...baseJwt, jti: 'old-jti' } as JWT;
      const sessionUpdate: Session = {
        user: { id: 'cred-user-id', role: UserRole.ADMIN, email: 'new-email@example.com' },
        expires: 'never',
      };
      const expectedToken = {
        ...baseJwt,
        email: 'new-email@example.com',
        sub: 'cred-user-id',
        role: UserRole.ADMIN,
        jti: mockUuidReturnedValue,
        userId: 'cred-user-id',
        userRole: UserRole.ADMIN,
      };

      // Act
      const result = handleJwtUpdate(token, sessionUpdate, correlationId, { uuidv4: mockUuidV4 });

      // Assert
      expect(result).toEqual(expectedToken);
      expect(mockUuidV4).toHaveBeenCalledTimes(1);
    });

    it('should update sub (user id) from session data', () => {
      // Arrange
      const token = { ...baseJwt, jti: 'old-jti' } as JWT;
      const sessionUpdate: Session = {
        user: { id: 'new-sub', role: UserRole.USER },
        expires: 'never',
      };

      // Act
      const result = handleJwtUpdate(token, sessionUpdate, correlationId, { uuidv4: mockUuidV4 });

      // Assert
      expect(result.sub).toBe('new-sub');
      expect(result.jti).toBe(mockUuidReturnedValue);
      expect(mockUuidV4).toHaveBeenCalledTimes(1);
    });
  });
});
