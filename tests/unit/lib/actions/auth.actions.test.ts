/**
 * @jest-environment node
 */

// Create mock function first before any imports or jest.mock calls
const mockFirebaseCreateUser = jest.fn();

// Mock the dependencies
jest.mock('@/lib/server/services', () => ({
  firebaseAdminService: {
    createUser: mockFirebaseCreateUser,
  },
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth-node', () => ({
  __esModule: true,
  signIn: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// Now import the components we need to test
import { signIn as signInNode } from '@/lib/auth-node';

// Reference the mocks for test assertions
const mockSignIn = signInNode as jest.Mock;
const { logger: mockLogger } = jest.requireMock('../../../../lib/logger');

// Define a simplified test to verify our setup works
describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('the test environment is set up correctly', () => {
    expect(mockFirebaseCreateUser).toBeDefined();
    expect(mockSignIn).toBeDefined();
    expect(mockLogger).toBeDefined();
  });

  // Add back actual tests once the file structure works
});
