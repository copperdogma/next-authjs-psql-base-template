/**
 * E2E Test Authentication Utilities
 *
 * This file provides utilities for mocking authentication in E2E tests.
 * Instead of trying to create a valid JWT token (which requires encryption with NEXTAUTH_SECRET),
 * we use special cookies to bypass the auth checks in the middleware.
 */

import { Page, BrowserContext } from '@playwright/test';
import { LoginCredentials } from './test-types';

/**
 * Sets auth bypass cookies for E2E tests
 */
export async function setupTestAuth(
  context: BrowserContext,
  page: Page,
  userData: LoginCredentials
): Promise<string> {
  // Navigate to a page to get the hostname
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Get the hostname for the cookie
  const hostname = new URL(page.url()).hostname;
  const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  const testSessionId = `test-session-${Date.now()}`;

  // Set auth bypass cookies for testing
  await context.addCookies([
    {
      name: '__playwright_auth_bypass',
      value: 'true',
      domain: hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      expires: expiry,
    },
    // Add a test session ID to identify this test session
    {
      name: '__playwright_test_session_id',
      value: testSessionId,
      domain: hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      expires: expiry,
    },
    // Add mock user details in cookies for the client components
    {
      name: '__playwright_test_user',
      value: JSON.stringify({
        id: userData.uid,
        name: userData.displayName,
        email: userData.email,
      }),
      domain: hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      expires: expiry,
    },
  ]);

  return testSessionId;
}

/**
 * Navigate to a protected route with test authentication
 */
export async function navigateWithTestAuth(
  page: Page,
  url: string,
  testSessionId: string
): Promise<void> {
  // Add the testSessionId as a query parameter to the URL
  const separator = url.includes('?') ? '&' : '?';
  const urlWithSessionId = `${url}${separator}testSessionId=${testSessionId}`;

  await page.goto(urlWithSessionId, {
    waitUntil: 'networkidle',
    timeout: 10000,
  });
}

/**
 * Utility to check if we're authenticated based on the URL
 */
export function isRedirectedToLogin(currentUrl: string): boolean {
  return currentUrl.includes('/login');
}

/**
 * Get test user data from cookies
 */
export async function getTestUserFromCookies(page: Page): Promise<any> {
  const userDataCookie = await page.evaluate(() => {
    return document.cookie.split('; ').find(cookie => cookie.startsWith('__playwright_test_user='));
  });

  if (!userDataCookie) return null;

  const userData = userDataCookie.split('=')[1];
  try {
    return JSON.parse(decodeURIComponent(userData));
  } catch (e) {
    console.error('Error parsing test user data from cookie:', e);
    return null;
  }
}
