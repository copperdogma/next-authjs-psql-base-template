export const mockAuthGetUser = jest.fn();
export const mockAuthCreateUser = jest.fn();
export const mockAuthUpdateUser = jest.fn();
export const mockInternalIsInitialized = jest.fn();
export const mockAuthGetUserByEmail = jest.fn();

export const getFirebaseAdminAuth = jest.fn(() => ({
  getUser: mockAuthGetUser,
  createUser: mockAuthCreateUser,
  updateUser: mockAuthUpdateUser,
  getUserByEmail: mockAuthGetUserByEmail,
}));

// This is the critical one that's called at module load time by auth-firebase-sync
export const isFirebaseAdminInitialized = mockInternalIsInitialized;

export const getFirebaseAdminApp = jest.fn(() => ({})); // Simple mock for the app object

// Optional: A reset function to call in test beforeEach, though jest.clearAllMocks() might cover it.
export const resetFirebaseAdminMocks = () => {
  mockAuthGetUser.mockReset();
  mockAuthCreateUser.mockReset();
  mockAuthUpdateUser.mockReset();
  mockInternalIsInitialized.mockReset();
  mockAuthGetUserByEmail.mockReset();
  getFirebaseAdminAuth.mockClear(); // .mockClear() for the main mock factory if it has call history
  getFirebaseAdminApp.mockClear();
};
