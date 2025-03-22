import { shouldRefreshToken, refreshUserTokenAndSession } from '../../../lib/auth/token';
import { User } from '@firebase/auth';
import { TOKEN_REFRESH_THRESHOLD_MS } from '../../../lib/auth/token';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'success' }),
  } as Response)
);

// Mock the console.error to keep test output clean
jest.spyOn(console, 'error').mockImplementation(() => {});

// Create a mock user factory function
const createMockUser = (options: {
  lastSignInTime?: string;
  creationTime?: string;
}): User => {
  return {
    metadata: {
      lastSignInTime: options.lastSignInTime,
      creationTime: options.creationTime,
    },
  } as unknown as User;
};

describe('Token Management', () => {
  // Store the original Date.now function
  const originalDateNow = Date.now;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore the original Date.now function
    global.Date.now = originalDateNow;
  });

  describe('shouldRefreshToken', () => {
    it('should return true if token is about to expire', () => {
      // Mock current time to a fixed value
      const NOW = 1633046400000; // 2021-10-01T00:00:00.000Z
      global.Date.now = jest.fn(() => NOW);
      
      // Create a timestamp that would make the token expire within the refresh threshold
      // Firebase tokens expire after 1 hour, and we refresh 5 minutes before expiration
      // So we need a timestamp that's about 55-56 minutes old
      const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
      const EXPIRES_SOON_TIME = new Date(NOW - (TOKEN_LIFETIME_MS - TOKEN_REFRESH_THRESHOLD_MS / 2)).toISOString();
      const user = createMockUser({ lastSignInTime: EXPIRES_SOON_TIME });
      
      // Token should be refreshed because it's close to expiration
      expect(shouldRefreshToken(user)).toBe(true);
    });
    
    it('should return false if token is not about to expire', () => {
      // Mock current time
      const NOW = 1633046400000; // 2021-10-01T00:00:00.000Z
      global.Date.now = jest.fn(() => NOW);
      
      // Set last sign in time to be far from the threshold (now - 30 minutes)
      const THIRTY_MINUTES_AGO = new Date(NOW - (30 * 60 * 1000)).toISOString();
      const user = createMockUser({ lastSignInTime: THIRTY_MINUTES_AGO });
      
      // Token should not be refreshed because it's not close to expiration
      expect(shouldRefreshToken(user)).toBe(false);
    });
    
    it('should use creation time if last sign in time is not available', () => {
      // Mock current time
      const NOW = 1633046400000; // 2021-10-01T00:00:00.000Z
      global.Date.now = jest.fn(() => NOW);
      
      // Set creation time to be far from the threshold (now - 30 minutes)
      const THIRTY_MINUTES_AGO = new Date(NOW - (30 * 60 * 1000)).toISOString();
      const user = createMockUser({ creationTime: THIRTY_MINUTES_AGO });
      
      // Token should not be refreshed because it's not close to expiration
      expect(shouldRefreshToken(user)).toBe(false);
    });
    
    it('should return true if no time stamps are available', () => {
      const user = createMockUser({});
      
      // Should refresh if we can't determine the token age
      expect(shouldRefreshToken(user)).toBe(true);
    });
    
    it('should return true if an error occurs during calculation', () => {
      // Create a user that will cause an error when calculating
      const badUser = {
        metadata: {
          get lastSignInTime() {
            throw new Error('Test error');
          },
          get creationTime() {
            throw new Error('Test error');
          },
        },
      } as unknown as User;
      
      // Should refresh if there's an error (better safe than sorry)
      expect(shouldRefreshToken(badUser)).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('refreshUserTokenAndSession', () => {
    it('should get a new token and update the session', async () => {
      // Create a mock user
      const mockToken = 'fresh-id-token';
      const user = {
        getIdToken: jest.fn().mockResolvedValue(mockToken),
      } as unknown as User;

      await refreshUserTokenAndSession(user);

      // Should have requested a fresh token
      expect(user.getIdToken).toHaveBeenCalledWith(true);

      // Should have sent the token to the session refresh endpoint
      expect(fetch).toHaveBeenCalledWith('/api/auth/session/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: mockToken }),
        credentials: 'include',
      });
    });

    it('should throw an error if token refresh fails', async () => {
      // Create a mock user that fails to get token
      const user = {
        getIdToken: jest.fn().mockRejectedValue(new Error('Token error')),
      } as unknown as User;

      await expect(refreshUserTokenAndSession(user)).rejects.toThrow('Token error');
    });

    it('should throw an error if session update fails', async () => {
      // Mock fetch to return an error
      (fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        } as Response)
      );

      const user = {
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      } as unknown as User;

      await expect(refreshUserTokenAndSession(user)).rejects.toThrow('Failed to refresh session');
    });
  });
}); 