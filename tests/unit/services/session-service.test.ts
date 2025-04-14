// Mock next-auth before importing SessionService
import { getServerSession as originalGetServerSession } from 'next-auth';
jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'), // Keep original exports
  getServerSession: jest.fn(), // Mock getServerSession
}));

import { mockDeep, mockReset } from 'jest-mock-extended';
import type { pino } from 'pino';
import type { AuthOptions, Session, User } from 'next-auth';
import { SessionService } from '../../../lib/services/session-service';

// Typed mock for the imported function
const mockGetServerSession = originalGetServerSession as jest.MockedFunction<
  typeof originalGetServerSession
>;

// Mocks
const mockLogger = mockDeep<pino.Logger>();
// Create a basic mock for AuthOptions - needs refinement if specific options are used
const mockAuthOptions = mockDeep<AuthOptions>();

// Define the expected structure of the User object within our Session
type SessionUser = User & { id: string };

// Helper to create a mock NextAuth Session
const createMockNextAuthSession = (overrides: Partial<Session>): Session => ({
  // Explicitly type the user object to include id
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    ...(overrides.user as Partial<SessionUser>),
  } as SessionUser,
  expires: new Date(Date.now() + 3600 * 1000).toISOString(), // Expires in 1 hour
  // Apply other top-level overrides, excluding user which is handled above
  ...Object.keys(overrides)
    .filter(key => key !== 'user')
    .reduce(
      (obj, key) => {
        obj[key as keyof Omit<Partial<Session>, 'user'>] =
          overrides[key as keyof Omit<Partial<Session>, 'user'>];
        return obj;
      },
      {} as Omit<Partial<Session>, 'user'>
    ),
});

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    mockReset(mockLogger);
    mockReset(mockAuthOptions); // Reset if needed, though likely static
    mockGetServerSession.mockReset(); // Reset the mocked next-auth function

    // Instantiate with mocked dependencies
    sessionService = new SessionService(mockAuthOptions, mockLogger);
  });

  it('should be defined', () => {
    expect(sessionService).toBeDefined();
  });

  it('should log initialization on construction', () => {
    // Instantiate directly here to check constructor log
    new SessionService(mockAuthOptions, mockLogger);
    expect(mockLogger.debug).toHaveBeenCalledWith('SessionService initialized');
  });

  // --- Test getServerSession ---
  describe('getServerSession', () => {
    it('should call nextAuthGetServerSession and log trace/debug on success', async () => {
      const mockSession = createMockNextAuthSession({});
      mockGetServerSession.mockResolvedValue(mockSession);

      const session = await sessionService.getServerSession();

      expect(session).toEqual(mockSession);
      expect(mockGetServerSession).toHaveBeenCalledWith(mockAuthOptions);
      expect(mockLogger.trace).toHaveBeenCalledWith('Getting server session');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ hasSession: true }),
        'Server session retrieved'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should call nextAuthGetServerSession and log trace/debug when no session found', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const session = await sessionService.getServerSession();

      expect(session).toBeNull();
      expect(mockGetServerSession).toHaveBeenCalledWith(mockAuthOptions);
      expect(mockLogger.trace).toHaveBeenCalledWith('Getting server session');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ hasSession: false }),
        'Server session retrieved'
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error if nextAuthGetServerSession fails', async () => {
      const authError = new Error('NextAuth failed');
      mockGetServerSession.mockRejectedValue(authError);

      await expect(sessionService.getServerSession()).rejects.toThrow(authError);

      expect(mockGetServerSession).toHaveBeenCalledWith(mockAuthOptions);
      expect(mockLogger.trace).toHaveBeenCalledWith('Getting server session');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: authError.message }),
        'Error getting server session'
      );
    });

    it('should use passed options if provided', async () => {
      const specificOptions = mockDeep<AuthOptions>();
      mockGetServerSession.mockResolvedValue(null); // Return value doesn't matter here

      await sessionService.getServerSession(specificOptions);

      expect(mockGetServerSession).toHaveBeenCalledWith(specificOptions);
      expect(mockGetServerSession).not.toHaveBeenCalledWith(mockAuthOptions);
    });
  });
});
