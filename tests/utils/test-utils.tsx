'use client';

import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ROUTES } from './routes';
import { SessionFixtures, createNextAuthUser } from './test-fixtures';
import { TestRenderResult } from './test-types';

// Manual mocks setup
// Create empty module mocks first, to be filled in later
jest.mock('next/navigation', () => ({}));
jest.mock('next-auth/react', () => ({}));

// Setup options interface
interface TestOptions {
  session?: Session | null;
  routerConfig?: Partial<typeof defaultRouterMock>;
  authState?: any; // For backward compatibility
}

// Create mock functions
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockPrefetch = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

// Default router mock for tests
const defaultRouterMock = {
  pathname: '/',
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  prefetch: mockPrefetch,
};

// Setup the mocks with the functions we created
const setupMocks = () => {
  // Setup next/navigation mock
  const navigationMock = jest.requireMock('next/navigation');
  navigationMock.useRouter = jest.fn().mockImplementation(() => defaultRouterMock);
  navigationMock.usePathname = jest.fn().mockImplementation(() => '/');

  const mockParams = new URLSearchParams();
  mockParams.set('callbackUrl', '/dashboard');
  navigationMock.useSearchParams = jest.fn().mockImplementation(() => mockParams);

  // Setup next-auth/react mock
  const nextAuthMock = jest.requireMock('next-auth/react');
  // Keep the original implementation for everything except what we mock
  Object.assign(nextAuthMock, jest.requireActual('next-auth/react'));
  nextAuthMock.signIn = mockSignIn;
  nextAuthMock.signOut = mockSignOut;
  // Replace SessionProvider with a simple pass-through to avoid state updates
  nextAuthMock.SessionProvider = ({
    children,
  }: {
    children: ReactNode;
    session?: Session | null;
  }) => children;
};

// Initialize mocks
setupMocks();

/**
 * Default test wrapper for components
 */
export function renderWithProviders(ui: ReactElement) {
  return {
    user: userEvent.setup(),
    ...rtlRender(ui),
  };
}

/**
 * Authenticated test wrapper that provides SessionProvider with authenticated user
 */
export function renderAuthenticatedComponent(ui: ReactElement) {
  return {
    user: userEvent.setup(),
    ...rtlRender(<SessionProvider session={SessionFixtures.authenticated()}>{ui}</SessionProvider>),
  };
}

/**
 * Test wrapper with unauthenticated user
 */
export function renderUnauthenticatedComponent(ui: ReactElement) {
  return {
    user: userEvent.setup(),
    ...rtlRender(<SessionProvider session={null}>{ui}</SessionProvider>),
  };
}

/**
 * Enhanced renderer for test components with NextAuth and router mocking
 */
export function render(ui: ReactElement, options: TestOptions = {}): TestRenderResult {
  // Reset mocks
  mockSignIn.mockReset();
  mockSignOut.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockForward.mockReset();
  mockPrefetch.mockReset();

  // Set up router with custom config or defaults
  const router = {
    ...defaultRouterMock,
    ...options.routerConfig,
  };

  // Update the router mock implementation
  jest.requireMock('next/navigation').useRouter.mockImplementation(() => router);

  // Simple wrapper to prevent async state updates
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
  };

  // Prevent React scheduler errors in test environment
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('port.postMessage') || args[0].includes('act(...)'))
    ) {
      return; // Suppress specific test environment errors
    }
    originalError(...args);
  };

  // Render with wrapper
  const result = rtlRender(ui, { wrapper: Wrapper });

  // Restore console
  console.error = originalError;

  return {
    ...result,
    user: userEvent.setup(),
    mockRouter: router,
    mockSignIn,
    mockSignOut,
  };
}

/**
 * Setup function that combines userEvent setup with render
 */
export function setup(ui: ReactElement, options: TestOptions = {}): TestRenderResult {
  return render(ui, options);
}

/**
 * Test utilities for common tasks
 */
export const TestUtils = {
  routes: ROUTES,
  renderWithProviders,
  renderAuthenticatedComponent,
  renderUnauthenticatedComponent,
  render,
  setup,

  // User data helpers
  createUser: createNextAuthUser,

  // DOM helpers
  queryByTestId: (container: HTMLElement, id: string) =>
    container.querySelector(`[data-testid="${id}"]`),
  findByTestId: async (container: HTMLElement, id: string) => {
    const element = container.querySelector(`[data-testid="${id}"]`);
    if (!element) throw new Error(`Element with data-testid="${id}" not found`);
    return element;
  },

  // Timing helpers
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
