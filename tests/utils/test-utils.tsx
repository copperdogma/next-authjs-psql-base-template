import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { AuthContext } from '../../app/providers/AuthProvider';
import type { User } from '@firebase/auth';
import { ROUTES } from './routes';

// Define AuthContextType based on the actual context structure
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isClientSide: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Create configurable mock router
const createMockRouter = (config = {}) => {
  const defaultConfig = {
    pathname: ROUTES.HOME,
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  };

  return {
    ...defaultConfig,
    ...config,
  };
};

// Use a string literal in the mock to avoid reference issues
jest.mock('next/navigation', () => {
  // Using hardcoded string for the mock
  const mockPathname = '/';

  return {
    useRouter: jest.fn().mockImplementation(() => createMockRouter()),
    usePathname: jest.fn().mockImplementation(() => mockPathname),
    useSearchParams: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockImplementation(key => (key === 'callbackUrl' ? '/dashboard' : null)),
    })),
  };
});

// Options for custom render function
interface RenderOptions {
  authState?: Partial<AuthContextType>;
  routerConfig?: Partial<ReturnType<typeof createMockRouter>>;
}

// Create a custom render function that includes providers
function customRender(ui: ReactElement, options: RenderOptions = {}) {
  const mockSignIn = jest.fn().mockResolvedValue(undefined);
  const mockSignOut = jest.fn().mockResolvedValue(undefined);

  const defaultAuthState: AuthContextType = { 
    user: null, 
    loading: false, 
    isClientSide: true,
    signIn: mockSignIn,
    signOut: mockSignOut
  };
  
  const authState = { ...defaultAuthState, ...options.authState };

  // Configure router if provided in options
  if (options.routerConfig) {
    const mockRouter = createMockRouter(options.routerConfig);
    jest.requireMock('next/navigation').useRouter.mockImplementation(() => mockRouter);

    // Handle pathname property safely
    const pathname =
      options.routerConfig.pathname !== undefined ? options.routerConfig.pathname : ROUTES.HOME;

    jest.requireMock('next/navigation').usePathname.mockImplementation(() => pathname);
  }

  return {
    ...render(<AuthContext.Provider value={authState}>{ui}</AuthContext.Provider>),
    // Return the mock router config for test assertions
    mockRouter: jest.requireMock('next/navigation').useRouter(),
    // Also return the auth mocks for easy assertions
    mockSignIn,
    mockSignOut
  };
}

/**
 * Setup function that combines render and userEvent.setup() for modern testing
 * This follows best practices for userEvent v14+
 */
function setup(ui: ReactElement, options: RenderOptions = {}) {
  return {
    user: userEvent.setup(),
    ...customRender(ui, options),
  };
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render, setup };
