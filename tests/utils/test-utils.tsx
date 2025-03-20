import { jsx as _jsx } from 'react/jsx-runtime';
import { render } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider';
import type { User } from '@firebase/auth';
import { ROUTES } from './routes';

// Create configurable mock router
const createMockRouter = (config = {}) => {
  const defaultConfig = {
    pathname: ROUTES.HOME,
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  };
  
  return {
    ...defaultConfig,
    ...config
  };
};

// Use a string literal in the mock to avoid reference issues
jest.mock('next/navigation', () => {
  // Using hardcoded string for the mock
  const mockPathname = '/';
  
  return {
    useRouter: jest.fn().mockImplementation(() => createMockRouter()),
    usePathname: jest.fn().mockImplementation(() => mockPathname),
  }
});

// Define the auth context type based on our updated context structure
type AuthState = {
  user: User | null;
  loading: boolean;
};

// Options for custom render function
interface RenderOptions {
  authState?: AuthState;
  routerConfig?: Partial<ReturnType<typeof createMockRouter>>;
}

// Create a custom render function that includes providers
function customRender(
  ui: ReactElement,
  options: RenderOptions = {}
) {
  const defaultAuthState = { user: null, loading: false };
  const authState = options.authState || defaultAuthState;
  
  // Configure router if provided in options
  if (options.routerConfig) {
    const mockRouter = createMockRouter(options.routerConfig);
    jest.requireMock('next/navigation').useRouter.mockImplementation(() => mockRouter);
    
    // Handle pathname property safely
    const pathname = options.routerConfig.pathname !== undefined 
      ? options.routerConfig.pathname 
      : ROUTES.HOME;
      
    jest.requireMock('next/navigation').usePathname.mockImplementation(() => pathname);
  }

  return {
    ...render(
      <AuthContext.Provider value={authState}>
        {ui}
      </AuthContext.Provider>
    ),
    // Return the mock router config for test assertions
    mockRouter: jest.requireMock('next/navigation').useRouter(),
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render } 