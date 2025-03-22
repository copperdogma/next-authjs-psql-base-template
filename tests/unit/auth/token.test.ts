import { shouldRefreshToken, refreshUserTokenAndSession } from '../../../lib/auth/token';
import { User } from '@firebase/auth';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'success' }),
  } as Response)
);

describe('Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldRefreshToken', () => {
    it('should return true if token is about to expire', () => {
      // Create a mock user with a creation time that would make token expire soon
      const user = {
        metadata: {
          creationTime: new Date(Date.now() - 58 * 60 * 1000).toISOString(), // 58 minutes ago
        },
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      } as unknown as User;

      const result = shouldRefreshToken(user);
      expect(result).toBe(true);
    });

    it('should return false if token is not close to expiring', () => {
      // Create a mock user with a recent creation time
      const user = {
        metadata: {
          creationTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        },
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      } as unknown as User;

      const result = shouldRefreshToken(user);
      expect(result).toBe(false);
    });

    it('should return true if there is an error checking token expiration', () => {
      // Create a mock user with invalid metadata that will cause an error
      const user = {
        metadata: null,
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      } as unknown as User;

      const result = shouldRefreshToken(user);
      expect(result).toBe(true);
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