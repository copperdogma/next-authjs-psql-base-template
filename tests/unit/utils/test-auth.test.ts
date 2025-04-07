/**
 * Unit tests for test-auth.ts utility functions
 */
import {
  setupTestAuth,
  navigateWithTestAuth,
  isRedirectedToLogin,
  getTestUserFromCookies,
} from '../../utils/test-auth';
import { TEST_USER } from '../../utils/test-constants';

// Mock Page and BrowserContext objects
const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  url: jest.fn().mockReturnValue('http://localhost:3000/'),
  evaluate: jest.fn(),
};

const mockContext = {
  addCookies: jest.fn().mockResolvedValue(undefined),
};

describe('test-auth.ts utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupTestAuth', () => {
    test('should setup test auth cookies and return a session ID', async () => {
      const result = await setupTestAuth(mockContext as any, mockPage as any, TEST_USER);

      // Check that page.goto was called with correct args
      expect(mockPage.goto).toHaveBeenCalledWith('/', { waitUntil: 'domcontentloaded' });

      // Check that page.url was called to get the hostname
      expect(mockPage.url).toHaveBeenCalled();

      // Check that context.addCookies was called
      expect(mockContext.addCookies).toHaveBeenCalled();

      // The call to addCookies should have 3 cookies
      const cookies = mockContext.addCookies.mock.calls[0][0];
      expect(cookies.length).toBe(3);

      // Check that cookies have the expected properties
      expect(cookies[0].name).toBe('__playwright_auth_bypass');
      expect(cookies[0].value).toBe('true');

      expect(cookies[1].name).toBe('__playwright_test_session_id');
      expect(typeof cookies[1].value).toBe('string');

      expect(cookies[2].name).toBe('__playwright_test_user');
      expect(JSON.parse(cookies[2].value)).toEqual({
        id: TEST_USER.uid,
        name: TEST_USER.displayName,
        email: TEST_USER.email,
      });

      // Check that a session ID is returned
      expect(typeof result).toBe('string');
      expect(result).toContain('test-session-');
    });
  });

  describe('navigateWithTestAuth', () => {
    test('should navigate to a URL with test session ID', async () => {
      const testSessionId = 'test-session-123';
      const url = '/dashboard';

      await navigateWithTestAuth(mockPage as any, url, testSessionId);

      // Check that page.goto was called with the correct URL and testSessionId
      expect(mockPage.goto).toHaveBeenCalledWith('/dashboard?testSessionId=test-session-123', {
        waitUntil: 'networkidle',
        timeout: 10000,
      });
    });

    test('should append testSessionId to URLs that already have query params', async () => {
      const testSessionId = 'test-session-123';
      const url = '/dashboard?param=value';

      await navigateWithTestAuth(mockPage as any, url, testSessionId);

      // Check that page.goto was called with the correct URL and testSessionId appended
      expect(mockPage.goto).toHaveBeenCalledWith(
        '/dashboard?param=value&testSessionId=test-session-123',
        {
          waitUntil: 'networkidle',
          timeout: 10000,
        }
      );
    });
  });

  describe('isRedirectedToLogin', () => {
    test('should return true if URL contains /login', () => {
      expect(isRedirectedToLogin('http://localhost:3000/login')).toBe(true);
      expect(isRedirectedToLogin('/login?callbackUrl=%2Fdashboard')).toBe(true);
    });

    test('should return false if URL does not contain /login', () => {
      expect(isRedirectedToLogin('http://localhost:3000/dashboard')).toBe(false);
      expect(isRedirectedToLogin('/profile')).toBe(false);
    });
  });

  describe('getTestUserFromCookies', () => {
    test('should return user data from cookies', async () => {
      const userData = { id: 'test-id', name: 'Test User', email: 'test@example.com' };
      mockPage.evaluate.mockImplementation(() => {
        return `__playwright_test_user=${encodeURIComponent(JSON.stringify(userData))}`;
      });

      const result = await getTestUserFromCookies(mockPage as any);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toEqual(userData);
    });

    test('should return null if no user cookie is found', async () => {
      mockPage.evaluate.mockImplementation(() => null);

      const result = await getTestUserFromCookies(mockPage as any);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should handle JSON parsing errors', async () => {
      // Temporarily suppress console.error for this specific test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockPage.evaluate.mockImplementation(() => '__playwright_test_user=invalid-json');

      const result = await getTestUserFromCookies(mockPage as any);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toBeNull();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
