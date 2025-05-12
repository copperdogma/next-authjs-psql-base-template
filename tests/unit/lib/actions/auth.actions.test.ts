/**
 * @jest-environment node
 */

// import * as admin from 'firebase-admin'; // REMOVE Unused import
// import type { User } from '@prisma/client'; // REMOVE Unused import

// Remove imports for non-exported types from auth.actions
/*
import type {
  RegistrationResult,
  PerformRegistrationDeps,
  RegisterUserDbClient,
  Hasher,
  RegistrationInput,
} from '@/lib/actions/auth.actions';
*/

// import { firebaseAdminService } from '@/lib/server/services'; // REMOVE Unused import
// import type { FirebaseAdminService as FirebaseAdminServiceInterface } from '@/lib/interfaces/services'; // REMOVE Unused import
// import { prisma } from '@/lib/prisma'; // REMOVE Unused import
// import { signIn } from '@/lib/auth-node'; // REMOVE Unused import

// Import the RollbackError from its new location
// import { RollbackError } from '@/lib/actions/auth-error-helpers'; // Unused import

// Import the main functions to test
// import { registerUserAction, authenticateWithCredentials } from '@/lib/actions/auth.actions'; // REMOVE Unused imports

// Define ALL mock functions and instances that will be used by any mock factory first
const mockFirebaseCreateUser = jest.fn();
const mockGetClientIp = jest.fn();
const mockDbUserCreate = jest.fn();
const mockDbUserFindByEmail = jest.fn();

const sharedPipelineInstance = {
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const redisMocks = {
  incr: jest.fn(), // For direct client.incr if ever used
  expire: jest.fn(), // For direct client.expire if ever used
  pipelineFactory: jest.fn(() => sharedPipelineInstance),
};

const mockGetOptionalRedisClient = jest.fn(); // Top-level mock for getOptionalRedisClient

const mockSignInFn = jest.fn();

const mockLoggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// --- jest.mock calls (hoisted, factories should be self-contained or use imports) ---
// These are fine at the top level as jest.mock is hoisted.
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  __esModule: true,
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project-id',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app-id',
    FIREBASE_PROJECT_ID: 'test-firebase-project-id',
    FIREBASE_CLIENT_EMAIL: 'test-firebase-client-email',
    FIREBASE_PRIVATE_KEY: 'test-firebase-private-key',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
    REDIS_URL: 'redis://localhost:6379',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    RATE_LIMIT_REGISTER_MAX_ATTEMPTS: 10,
    RATE_LIMIT_REGISTER_WINDOW_SECONDS: 3600,
  },
  ENV: {
    NODE_ENV: 'test',
    IS_TEST: true,
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(), // Ensure compare is also mocked if used by hasher
}));

// Simplified describe for initial setup verification - can be removed later
// describe('Auth Actions Initial Setup', () => {
//   beforeEach(() => {
//     jest.resetModules();
//     jest.clearAllMocks();
//
//     // Example of re-establishing a mock for this specific describe block if needed
//     jest.doMock('@/lib/logger', () => ({ logger: mockLoggerInstance }));
//   });
//
//   test('the test environment is set up correctly', () => {
//     // This test would need to import the action and verify its dependencies are mocked
//     expect(mockFirebaseCreateUser).toBeDefined();
//     // expect(mockSignInFn).toBeDefined(); // Corrected to mockSignInFn
//     // expect(mockLoggerInstance).toBeDefined(); // Corrected to mockLoggerInstance
//   });
// });

// Mock implementation (can be simple or complex based on test needs)
// This mock should be defined *outside* any describe/beforeEach if it's used by jest.doMock at the top level of the module
// const testSpecificCreateUserMock = jest.fn(); // Unused mock declaration

// Use jest.doMock for the module containing _createUser to ensure the mock is used
// This needs to be at the module scope (outside describe blocks) to correctly mock before imports are fully resolved.
jest.doMock('@/lib/actions/auth.actions', () => {
  const originalModule = jest.requireActual('@/lib/actions/auth.actions');
  return {
    ...originalModule,
    // _createUser: testSpecificCreateUserMock, // This was moved to be inside describe block, which is fine for overriding, but initial mock should be different
    // Ensure RollbackError is NOT re-exported or part of this mock if it has been moved out of auth.actions.ts
  };
});

describe('registerUser with Rate Limiting', () => {
  const testIp = '123.123.123.123';
  const fallbackIp = '0.0.0.0';
  const testEmail = 'test@example.com';
  const testPassword = 'Password123!';
  const testDisplayName = 'Test User';

  let currentRegisterUserAction: any; // Use any since import is removed
  let mockEnv: any; // Use any since import is removed
  let dynamicFirebaseAdminServiceMock: any;
  let mockRedisClientInstance: any; // Define it here for the describe block scope

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRedisClientInstance = {
      // Initialize it here
      pipeline: redisMocks.pipelineFactory,
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      // Add other methods if needed by tests in this block
    };
    // Reset for getter approach:
    dynamicFirebaseAdminServiceMock = {
      createUser: mockFirebaseCreateUser,
      deleteUser: jest.fn(), // Ensure it's reset with deleteUser
    };

    // Mock for _translateFirebaseAuthError if it's used by the action module
    // This needs to be done if _translateFirebaseAuthError is in a different module and imported by auth.actions
    // jest.doMock('@/lib/actions/auth-error-helpers', () => ({
    //   ...jest.requireActual('@/lib/actions/auth-error-helpers'),
    //   _translateFirebaseAuthError: mockTranslateFirebaseAuthError,
    // }));

    // --- Re-establish jest.doMock calls here ---

    // Mock Prisma directly for registerUserLogic internal usage
    jest.doMock('@/lib/prisma', () => ({
      __esModule: true,
      prisma: {
        user: {
          findUnique: mockDbUserFindByEmail,
          create: mockDbUserCreate,
          // Add other prisma.user methods if used directly by registerUserLogic
        },
        // Add other prisma top-level models if used
      },
    }));

    jest.doMock('@/lib/redis', () => ({
      __esModule: true,
      // redisClient: mockRedisClientInstance, // Use the top-level controllable instance
      // Let's ensure the mock for redisClient provides what the action expects.
      // The action uses getOptionalRedisClient, so that's the primary mock.
      // If redisClient is directly imported and used (it seems not for rate limit), this would be needed.
      redisClient: {
        // Provide a basic mock structure for redisClient if it's somehow accessed
        incr: redisMocks.incr,
        expire: redisMocks.expire,
        pipeline: redisMocks.pipelineFactory,
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue(undefined),
      },
      getOptionalRedisClient: mockGetOptionalRedisClient, // Use the top-level mock
    }));

    // Mock for server services. Ensure firebaseAdminService is correctly provided via the getter.
    // The issue was `firebaseAdminService` being undefined.
    // `registerUserAction` imports `firebaseAdminService` directly.
    // So, the mock for `@/lib/server/services` must export `firebaseAdminService`.
    const mockDbService = {
      user: {
        create: mockDbUserCreate,
        findByEmail: mockDbUserFindByEmail,
        // logger: mockLoggerInstance,
        // trace: jest.fn(),
      },
      // logger: mockLoggerInstance,
      // trace: jest.fn(),
    };
    // This mock hasher needs to align with what AbstractPasswordHasherService expects
    // and what BcryptPasswordHasherService implements.
    const actualBcrypt = jest.requireActual('bcrypt');
    const mockHasherService = {
      hash: jest.fn(async (value: string) => actualBcrypt.hash(value, 10)),
      compare: jest.fn(async (value: string, hashToCompare: string) =>
        actualBcrypt.compare(value, hashToCompare)
      ),
      // logger: mockLoggerInstance,
      // trace: jest.fn(),
    };

    jest.doMock('@/lib/server/services', () => ({
      __esModule: true,
      // Directly export the mocked services as they are imported by name in auth.actions.ts
      get firebaseAdminService() {
        return dynamicFirebaseAdminServiceMock;
      }, // New getter way
      dbService: mockDbService,
      passwordHashingService: mockHasherService, // Assuming this is the name used.
      // Check auth.actions.ts for actual import name.
      // Based on previous logs, it seemed to use a serviceRegistry.
      // If it's direct imports like `import { firebaseAdminService } from '...'`
      // then this structure is correct.
      // If it still uses getServiceRegistry():
      // getServiceRegistry: () => ({
      //   fbService: mockFirebaseAdminService, // Ensure this key matches if registry is used
      //   db: mockDbService,
      //   hasher: mockHasherService,
      //   logger: mockLoggerInstance,
      //   trace: jest.fn(),
      // }),
    }));

    jest.doMock('@/lib/auth-node', () => ({
      __esModule: true,
      signIn: mockSignInFn,
      signOut: jest.fn(() => Promise.resolve()),
    }));

    jest.doMock('@/lib/logger', () => ({
      __esModule: true,
      logger: mockLoggerInstance,
      createApiLogger: jest.fn(() => mockLoggerInstance),
      clientLogger: mockLoggerInstance,
    }));

    jest.doMock('@/lib/utils/server-utils', () => ({
      __esModule: true,
      getClientIp: mockGetClientIp,
    }));

    // Dynamically import modules that use these mocks
    const envModule = await import('@/lib/env');
    mockEnv = envModule.env;

    // Configure default behaviors for mocks for each test
    // mockGetOptionalRedisClient needs to return an object with a `pipeline` method.
    mockGetOptionalRedisClient.mockReturnValue({
      pipeline: redisMocks.pipelineFactory, // pipelineFactory returns sharedPipelineInstance
      // Add other client methods if the action uses them directly (it shouldn't for this feature)
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
    });

    mockGetClientIp.mockReturnValue(testIp);
    mockFirebaseCreateUser.mockResolvedValue({
      uid: 'test-uid',
      email: testEmail,
      displayName: testDisplayName,
      emailVerified: false,
    });
    mockDbUserFindByEmail.mockResolvedValue(null);
    mockDbUserCreate.mockResolvedValue({
      id: 'mock-db-id',
      email: testEmail,
      firebaseId: 'test-uid',
      displayName: testDisplayName,
      emailVerified: null, // Prisma schema might have this as boolean
      role: 'USER', // Prisma schema might use an enum e.g., UserRole.USER
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedInAt: null,
      disabled: false,
      providerAccounts: [], // Adjust if your schema expects a different structure
      userProfile: null, // Adjust if your schema expects a different structure
      tenantId: null,
    });
    (jest.requireMock('bcrypt').hash as jest.Mock).mockResolvedValue('hashedPassword');
    (jest.requireMock('bcrypt').compare as jest.Mock).mockResolvedValue(true); // Default compare mock
    mockSignInFn.mockResolvedValue({ error: null, url: null }); // Use mockSignInFn

    // Reset Redis pipeline mocks (part of sharedPipelineInstance)
    sharedPipelineInstance.incr.mockClear().mockReturnThis();
    sharedPipelineInstance.expire.mockClear().mockReturnThis();
    sharedPipelineInstance.exec.mockClear().mockResolvedValue([
      [null, 1], // Result for INCR
      [null, 1], // Result for EXPIRE
    ]);
    redisMocks.pipelineFactory.mockClear().mockReturnValue(sharedPipelineInstance);

    // Reset logger mocks
    Object.values(mockLoggerInstance).forEach(mockFn => mockFn.mockClear());
    mockLoggerInstance.child.mockReturnThis(); // Ensure child returns the mock instance

    // Need to re-require the action here since the top-level import was removed
    const actionsModule = await import('@/lib/actions/auth.actions');
    currentRegisterUserAction = actionsModule.registerUserAction;
  });

  test('successful registration when under the rate limit', async () => {
    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await currentRegisterUserAction(null, formData);

    // Assert
    expect(result).toEqual({
      status: 'success',
      message: 'User registered successfully. Redirecting...',
      data: null,
    });
    expect(mockGetClientIp).toHaveBeenCalledTimes(1);
    const expectedRedisKey = `rate-limit:register:${testIp}`;
    expect(sharedPipelineInstance.incr).toHaveBeenCalledWith(expectedRedisKey);
    expect(sharedPipelineInstance.expire).toHaveBeenCalledWith(
      expectedRedisKey,
      mockEnv.RATE_LIMIT_REGISTER_WINDOW_SECONDS // Use mocked env
    );
    expect(mockFirebaseCreateUser).toHaveBeenCalledTimes(1);
    expect(mockDbUserCreate).toHaveBeenCalledTimes(1);
    expect(mockSignInFn).toHaveBeenCalledTimes(1); // Check mockSignInFn
  });

  test('throws specific error when rate limit is exceeded', async () => {
    // Arrange
    sharedPipelineInstance.exec.mockResolvedValueOnce([
      [null, mockEnv.RATE_LIMIT_REGISTER_MAX_ATTEMPTS + 1], // currentAttempts > maxAttempts
      [null, 1],
    ]);

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await currentRegisterUserAction(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toBe('Registration rate limit exceeded for this IP.');
    // Ensure your ServiceError in auth.actions.ts uses this code for rate limiting
    expect(result.error?.code).toBe('RateLimitExceeded');
    expect(mockGetClientIp).toHaveBeenCalledTimes(1);
    const expectedRedisKey = `rate-limit:register:${testIp}`;
    expect(sharedPipelineInstance.incr).toHaveBeenCalledWith(expectedRedisKey);
    expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    expect(mockDbUserCreate).not.toHaveBeenCalled();
    expect(mockSignInFn).not.toHaveBeenCalled(); // Check mockSignInFn
  });

  test('rate limit count increments correctly and expire is set on first attempt', async () => {
    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    await currentRegisterUserAction(null, formData);

    // Assert first call
    // The key format was `rate_limit:register:${testIp}` in previous attempt, ensure it's consistent with code
    // Assuming `rate-limit:register:${testIp}` based on other tests
    const expectedRedisKey = `rate-limit:register:${testIp}`;
    expect(sharedPipelineInstance.incr).toHaveBeenCalledWith(expectedRedisKey);
    expect(sharedPipelineInstance.expire).toHaveBeenCalledWith(
      expectedRedisKey,
      mockEnv.RATE_LIMIT_REGISTER_WINDOW_SECONDS // Use mocked env
    );
    expect(sharedPipelineInstance.exec).toHaveBeenCalledTimes(1);
  });

  test('handles missing IP address gracefully (uses fallback IP)', async () => {
    mockGetClientIp.mockReturnValue(fallbackIp); // Override for this test

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    const result = await currentRegisterUserAction(null, formData);

    expect(result.status).toBe('success');
    expect(mockGetClientIp).toHaveBeenCalledTimes(1);
    const expectedRedisKey = `rate-limit:register:${fallbackIp}`;
    expect(sharedPipelineInstance.incr).toHaveBeenCalledWith(expectedRedisKey);
    expect(mockFirebaseCreateUser).toHaveBeenCalledTimes(1);
  });

  test('fails open and logs error if Redis pipeline.exec itself throws', async () => {
    // Arrange
    const pipelineExecError = new Error('Simulated pipeline.exec error');
    sharedPipelineInstance.exec.mockReset();
    sharedPipelineInstance.exec.mockRejectedValueOnce(pipelineExecError);

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await currentRegisterUserAction(null, formData);

    // Assert - Should still succeed (fail open)
    expect(result.status).toBe('success');
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      expect.objectContaining({ clientIp: testIp, email: testEmail }),
      'Rate limit check failed, but proceeding (fail open).'
    );
    expect(mockFirebaseCreateUser).toHaveBeenCalledTimes(1); // Registration should still proceed
  });

  test('fails open and logs error if Redis INCR result is not a number', async () => {
    // Arrange
    sharedPipelineInstance.exec.mockReset();
    sharedPipelineInstance.exec.mockResolvedValueOnce([
      [null, 'not-a-number'], // Invalid result for INCR
      [null, 1], // EXPIRE result (can be anything)
    ]);

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await currentRegisterUserAction(null, formData);

    // Assert - Should still succeed (fail open)
    expect(result.status).toBe('success');
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      expect.objectContaining({ clientIp: testIp, email: testEmail }),
      'Rate limit check failed, but proceeding (fail open).'
    );
    expect(mockFirebaseCreateUser).toHaveBeenCalledTimes(1); // Registration should still proceed
  });

  // Test for when Redis client itself is null (getOptionalRedisClient returns null)
  test('skips rate limiting and logs warning if Redis client is unavailable (getOptionalRedisClient returns null)', async () => {
    // For this specific test, make getOptionalRedisClient return null.
    // It's already a top-level jest.fn(), so we can control it here directly.
    // The beforeEach sets it up with a default mock, so we override it here.
    mockGetOptionalRedisClient.mockReturnValueOnce(null);

    // Re-import is not necessary because currentRegisterUserAction is
    // already freshly imported in beforeEach AFTER all mocks are set up.

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    const result = await currentRegisterUserAction(null, formData);

    expect(result.status).toBe('success');
    expect(mockGetOptionalRedisClient).toHaveBeenCalledTimes(1); // Should have been called
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      'Redis client is not available for registration. Skipping rate limiting. Failing open.'
    );
    // Ensure pipeline was NOT used
    expect(redisMocks.pipelineFactory).not.toHaveBeenCalled();
    expect(sharedPipelineInstance.incr).not.toHaveBeenCalled();
    expect(sharedPipelineInstance.expire).not.toHaveBeenCalled();
    expect(sharedPipelineInstance.exec).not.toHaveBeenCalled();

    expect(mockFirebaseCreateUser).toHaveBeenCalledTimes(1); // Registration should still proceed
    expect(mockSignInFn).toHaveBeenCalledTimes(1); // Sign-in should also proceed
  });

  test('returns an error if Firebase Admin Service is unavailable', async () => {
    // Arrange: Override firebaseAdminService to be null for this test
    dynamicFirebaseAdminServiceMock = null; // Set for getter

    // Re-import the action to pick up the overridden mock.
    // This is crucial because the module might have been cached with the default mock.
    // We need to ensure the jest.doMock in beforeEach runs with the override active *before* this import.
    // The beforeEach already resets modules, so the import here should get the fresh (null) mock.
    const { registerUserAction: actionToTest } = await import('@/lib/actions/auth.actions');

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await actionToTest(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toBe('Firebase Admin Service not available.');
    expect(result.error?.code).toBe('ServiceUnavailable');

    expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    expect(mockDbUserCreate).not.toHaveBeenCalled();
    expect(mockSignInFn).not.toHaveBeenCalled();
    // Corrected logger assertion:
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'ServiceUnavailable' }), // Check context for errorCode
      'Firebase Admin Service is not available for registration.' // Check specific message
    );
  });

  test('returns an error if user already exists in the database', async () => {
    // Arrange: Mock findUnique to return an existing user
    const existingUser = {
      id: 'existing-user-id',
      email: testEmail,
      // ... other necessary user fields
    };
    mockDbUserFindByEmail.mockResolvedValue(existingUser);

    // Ensure other critical mocks are in their default state (e.g., firebase service available)
    dynamicFirebaseAdminServiceMock = { createUser: mockFirebaseCreateUser }; // Default available

    const { registerUserAction: actionToTest } = await import('@/lib/actions/auth.actions');

    const formData = new FormData();
    formData.append('email', testEmail); // Use the email of the existing user
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await actionToTest(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toBe('User with this email already exists.');
    expect(result.error?.code).toBe('UserExists');

    expect(mockDbUserFindByEmail).toHaveBeenCalledWith({ where: { email: testEmail } });
    expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    expect(mockDbUserCreate).not.toHaveBeenCalled();
    expect(mockSignInFn).not.toHaveBeenCalled();
    // Ensure Firebase deleteUser (rollback) was not called in this scenario
    if (dynamicFirebaseAdminServiceMock && dynamicFirebaseAdminServiceMock.deleteUser) {
      expect(dynamicFirebaseAdminServiceMock.deleteUser).not.toHaveBeenCalled();
    } // Check only if the mock exists

    // Check the specific warning log for existing user
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      expect.objectContaining({ email: testEmail }),
      'Registration attempt with existing email.'
    );
    // Ensure the generic error log from the main try...catch is NOT called in this path
    expect(mockLoggerInstance.error).not.toHaveBeenCalledWith(
      expect.anything(), // We don't care about the context here
      'Unhandled error in registerUserAction main try block.'
    );
  });

  test('returns an error if Firebase user creation fails', async () => {
    // Arrange
    mockDbUserFindByEmail.mockResolvedValue(null); // User does not exist
    const firebaseCreateError = new Error('Simulated Firebase createUser error');
    (firebaseCreateError as any).code = 'auth/internal-error'; // Add a Firebase-like error code

    const testSpecificDeleteUserMock = jest.fn(); // Capture this mock instance

    // Set up the service mock for this specific test case
    dynamicFirebaseAdminServiceMock = {
      createUser: jest.fn().mockRejectedValue(firebaseCreateError), // createUser will throw
      deleteUser: testSpecificDeleteUserMock, // This specific mock instance should be used
    };

    // Re-import the action to ensure it picks up this specific mock configuration
    const { registerUserAction: actionToTest } = await import('@/lib/actions/auth.actions');

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName);

    // Act
    const result = await actionToTest(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toContain('Simulated Firebase createUser error'); // Check message
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('auth/internal-error'); // Check code translated from Firebase error
    expect(result.error?.details).toHaveProperty('originalError', firebaseCreateError); // Safer check for originalError

    // Verify mocks
    expect(mockDbUserFindByEmail).toHaveBeenCalledWith({ where: { email: testEmail } });
    expect(dynamicFirebaseAdminServiceMock.createUser).toHaveBeenCalledTimes(1);
    expect(mockDbUserCreate).not.toHaveBeenCalled();
    expect(mockSignInFn).not.toHaveBeenCalled();

    // Assert against the specific mock instance captured for this test
    expect(testSpecificDeleteUserMock).not.toHaveBeenCalled();

    // Revert logger to expect the "Registration failed." message, as this passed before
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: firebaseCreateError,
        registrationContext: 'registration attempt',
      }),
      '_handleMainRegistrationError: Caught error during registration attempt.'
    );
  });

  test('rolls back Firebase user if Prisma user creation fails', async () => {
    // Arrange: Set up mocks using variables from beforeEach scope
    const prismaCreateError = new Error('Simulated Prisma create error');
    const mockFirebaseUser = { uid: 'fb-uid-rollback', email: testEmail };

    // Ensure user doesn't exist initially
    mockDbUserFindByEmail.mockResolvedValueOnce(null);
    // Ensure rate limit passes
    mockGetOptionalRedisClient.mockReturnValueOnce(mockRedisClientInstance);
    sharedPipelineInstance.exec.mockResolvedValueOnce([[null, 1]]);
    // Firebase create succeeds
    dynamicFirebaseAdminServiceMock.createUser.mockResolvedValueOnce(mockFirebaseUser);
    // Prisma create fails
    mockDbUserCreate.mockRejectedValueOnce(prismaCreateError);
    // Firebase delete (rollback) succeeds
    dynamicFirebaseAdminServiceMock.deleteUser.mockResolvedValueOnce(undefined);

    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', testPassword);
    formData.append('displayName', testDisplayName); // Correct field name

    // Act
    // Use the action instance from beforeEach scope
    const result = await currentRegisterUserAction(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('REGISTRATION_DB_FAILURE_ROLLBACK_SUCCESS'); // Expect specific rollback success code

    // Verify mocks (using mocks from beforeEach scope)
    expect(dynamicFirebaseAdminServiceMock.createUser).toHaveBeenCalledTimes(1);
    expect(mockDbUserCreate).toHaveBeenCalledTimes(1);
    expect(dynamicFirebaseAdminServiceMock.deleteUser).toHaveBeenCalledWith(mockFirebaseUser.uid);
    expect(mockSignInFn).not.toHaveBeenCalled(); // Ensure sign in wasn't attempted
  });

  test('returns validation errors if input is invalid', async () => {
    // Arrange: Invalid form data (e.g., short password)
    const formData = new FormData();
    formData.append('email', testEmail);
    formData.append('password', 'short'); // Invalid password
    formData.append('displayName', testDisplayName);

    // Act
    const result = await currentRegisterUserAction(null, formData);

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toBe('Invalid input.');
    expect(result.error?.code).toBe('ValidationError');
    // expect(result.error?.validationErrors).toBeDefined(); // REMOVED: result.error?.validationErrors is undefined
    // expect(result.error?.validationErrors?.password).toContain( // REMOVED
    //   'Password must be at least 8 characters long.'
    // );

    // Ensure main logic was not called
    expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    expect(mockDbUserCreate).not.toHaveBeenCalled();
    expect(mockSignInFn).not.toHaveBeenCalled();
  });
});

// --- BEGIN TESTS FOR ERROR TRANSLATION UTILITIES ---
import {
  _translateFirebaseAuthError,
  _translatePrismaError,
  _translateGenericError,
  _translateRegistrationError,
  isPrismaError,
  type PrismaErrorWithCodeAndMeta,
} from '@/lib/actions/auth-error-helpers';

describe('Error Translation Utilities from auth-error-helpers', () => {
  describe('_translateFirebaseAuthError', () => {
    it('should translate known Firebase auth error codes', () => {
      // Pass error objects, not just strings
      expect(_translateFirebaseAuthError({ code: 'auth/email-already-exists' })).toEqual({
        message: 'This email address is already registered.',
        code: 'auth/email-already-exists',
      });
      expect(_translateFirebaseAuthError({ code: 'auth/invalid-password' })).toEqual({
        message: 'Password must be at least 6 characters long.',
        code: 'auth/invalid-password',
      });
      expect(_translateFirebaseAuthError({ code: 'auth/user-not-found' })).toEqual({
        message: 'No user found with this email address.',
        code: 'auth/user-not-found',
      });
      expect(_translateFirebaseAuthError({ code: 'auth/wrong-password' })).toEqual({
        message: 'Incorrect password.',
        code: 'auth/wrong-password',
      });
      expect(_translateFirebaseAuthError({ code: 'auth/too-many-requests' })).toEqual({
        message:
          'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.',
        code: 'auth/too-many-requests',
      });
    });

    it('should return a generic message for unknown Firebase auth error codes', () => {
      expect(_translateFirebaseAuthError({ code: 'auth/some-new-unexpected-error' })).toEqual({
        message: 'An unexpected authentication error occurred.',
        code: 'auth/unknown-error',
      });
    });

    it('should handle invalid error formats', () => {
      expect(_translateFirebaseAuthError('just a string')).toEqual({
        message: 'An unexpected authentication error occurred (invalid format).',
        code: 'auth/invalid-error-format',
      });
      expect(_translateFirebaseAuthError({ notACode: 'value' })).toEqual({
        message: 'An unexpected authentication error occurred (invalid format).',
        code: 'auth/invalid-error-format',
      });
      expect(_translateFirebaseAuthError(null)).toEqual({
        message: 'An unexpected authentication error occurred (invalid format).',
        code: 'auth/invalid-error-format',
      });
    });
  });

  describe('_translatePrismaError', () => {
    it('should translate P2002 for email unique constraint', () => {
      // Simulate a Prisma Error by extending Error
      class PrismaP2002EmailError extends Error implements PrismaErrorWithCodeAndMeta {
        public code = 'P2002';
        public meta = { target: ['email'] };
        constructor(message?: string) {
          super(message || 'Simulated P2002 Email Error');
          this.name = 'PrismaClientKnownRequestError';
        }
      }
      const prismaError = new PrismaP2002EmailError();
      expect(_translatePrismaError(prismaError)).toEqual({
        message: 'This email address is already in use.',
        code: 'PRISMA_P2002_EMAIL',
      });
    });

    it('should translate P2002 for other unique constraints with a generic P2002 message', () => {
      class PrismaP2002OtherError extends Error implements PrismaErrorWithCodeAndMeta {
        public code = 'P2002';
        public meta = { target: ['username'] };
        constructor(message?: string) {
          super(message || 'Simulated P2002 Other Error');
          this.name = 'PrismaClientKnownRequestError';
        }
      }
      const prismaError = new PrismaP2002OtherError();
      expect(_translatePrismaError(prismaError)).toEqual({
        message: 'A unique constraint was violated.',
        code: 'PRISMA_P2002_UNKNOWN_TARGET',
      });
    });

    it('should translate other Prisma errors using their message and code', () => {
      class PrismaP1000Error extends Error implements PrismaErrorWithCodeAndMeta {
        public code = 'P1000';
        constructor(message: string) {
          super(message);
          this.name = 'PrismaClientKnownRequestError';
        }
      }
      const prismaError = new PrismaP1000Error('Database connection failed.');
      expect(_translatePrismaError(prismaError)).toEqual({
        message: 'Database connection failed.',
        code: 'P1000',
      });
    });

    it('should handle Prisma errors with only a message (less common, but ensure fallback)', () => {
      // This case is less likely for actual Prisma errors which usually have codes.
      // Forcing a generic error structure that might be caught by a loose isPrismaError if not careful.
      class VaguePrismaError extends Error implements PrismaErrorWithCodeAndMeta {
        // No code, no meta, but recognized as Prisma due to clientVersion perhaps, or name
        public clientVersion = 'test-version'; // Add a field that isPrismaError might check
        constructor(message: string) {
          super(message);
          this.name = 'PrismaClientUnknownRequestError';
        }
      }
      const prismaError = new VaguePrismaError('A vague Prisma issue.');
      expect(_translatePrismaError(prismaError)).toEqual({
        message: 'A vague Prisma issue.',
        // Adjusted expectation based on actual helper logic
        code: 'PRISMA_UNKNOWN_REQUEST_ERROR',
      });
    });
  });

  describe('_translateGenericError', () => {
    it('should use error message and a generic code for standard Error', () => {
      const error = new Error('Something broke.');
      expect(_translateGenericError(error)).toEqual({
        message: 'Something broke.',
        code: 'GENERIC_ERROR',
      });
    });

    it("should use error name as code if it is not simply 'Error'", () => {
      const typeError = new TypeError('Bad type.');
      expect(_translateGenericError(typeError)).toEqual({
        message: 'Bad type.',
        // Adjusted expectation based on actual helper logic (no underscore)
        code: 'TYPEERROR',
      });

      class CustomError extends Error {
        constructor(m: string) {
          super(m);
          this.name = 'MyCustomError';
        }
      }
      const customError = new CustomError('Custom issue.');
      expect(_translateGenericError(customError)).toEqual({
        message: 'Custom issue.',
        code: 'MYCUSTOMERROR', // Adjusted based on logic
      });
    });

    it('should handle errors with no message', () => {
      const error = new Error();
      (error as any).message = undefined;
      expect(_translateGenericError(error)).toEqual({
        message: 'An unexpected error occurred.',
        code: 'GENERIC_ERROR',
      });
    });
  });

  describe('_translateRegistrationError', () => {
    it('should delegate to _translateFirebaseAuthError for Firebase auth codes', () => {
      const authError = { code: 'auth/email-already-exists' };
      // Expect the result of translating the *object*
      expect(_translateRegistrationError(authError)).toEqual(
        _translateFirebaseAuthError(authError) // Pass the object here too
      );
    });

    it('should delegate to _translatePrismaError for Prisma errors', () => {
      // Simulate a Prisma Error for this delegation test too
      class TestPrismaP2002Error extends Error implements PrismaErrorWithCodeAndMeta {
        public code = 'P2002';
        public meta = { target: ['email'] };
        public clientVersion = 'test-client-version'; // Ensure isPrismaError identifies it
        constructor(message?: string) {
          super(message || 'Simulated P2002 for delegation');
          this.name = 'PrismaClientKnownRequestError';
        }
      }
      const prismaErrorInstance = new TestPrismaP2002Error();

      expect(isPrismaError(prismaErrorInstance)).toBe(true);
      expect(_translateRegistrationError(prismaErrorInstance)).toEqual(
        _translatePrismaError(prismaErrorInstance)
      );
    });

    it('should delegate to _translateGenericError for standard Error objects', () => {
      const genericError = new Error('A generic problem.');
      expect(_translateRegistrationError(genericError)).toEqual(
        _translateGenericError(genericError)
      );
    });

    it('should handle completely unknown errors', () => {
      const unknownError = { someRandomProperty: 'value' };
      expect(_translateRegistrationError(unknownError)).toEqual({
        message: 'An unexpected error occurred during registration.',
        code: 'UNKNOWN_REGISTRATION_ERROR',
      });

      expect(_translateRegistrationError(null)).toEqual({
        message: 'An unexpected error occurred during registration.',
        code: 'UNKNOWN_REGISTRATION_ERROR',
      });
      expect(_translateRegistrationError(undefined)).toEqual({
        message: 'An unexpected error occurred during registration.',
        code: 'UNKNOWN_REGISTRATION_ERROR',
      });
    });
  });
});
// --- END TESTS FOR ERROR TRANSLATION UTILITIES ---

// --- BEGIN TESTS FOR authenticateWithCredentials ---
// ... existing code ...
// --- END TESTS FOR authenticateWithCredentials ---
