import { screen } from '@testing-library/react';
import { render, setup } from '../../utils/test-utils';
import { ROUTES } from '../../utils/routes';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockImplementation(() => ({
    pathname: '/',
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: jest.fn().mockImplementation(() => '/'),
}));

// Simple test component
const TestComponent = ({
  requiresAuth = false,
  onNavigate = () => {},
}: {
  requiresAuth?: boolean;
  onNavigate?: () => void;
}) => {
  const handleClick = () => {
    onNavigate();
  };

  return (
    <div>
      <h1>Test Component</h1>
      {requiresAuth && <p data-testid="auth-content">Authenticated content</p>}
      <button onClick={handleClick} data-testid="nav-button">
        Navigate
      </button>
    </div>
  );
};

describe('Test Utils', () => {
  const TestComponent = () => <div>Test Component</div>;

  describe('render function', () => {
    it('renders with default auth state', () => {
      const { container, mockSignIn, mockSignOut } = render(<TestComponent />);
      expect(container).toHaveTextContent('Test Component');
      expect(mockSignIn).toBeDefined();
      expect(mockSignOut).toBeDefined();
    });

    it('renders with custom auth state', () => {
      const customAuthState = {
        loading: true,
        user: { uid: 'test-uid' } as any
      };
      const { container } = render(<TestComponent />, { authState: customAuthState });
      expect(container).toHaveTextContent('Test Component');
    });

    it('renders with custom router config', () => {
      const customRouter = {
        push: jest.fn(),
      };
      const { mockRouter } = render(<TestComponent />, { routerConfig: customRouter });
      expect(mockRouter.push).toBeDefined();
    });

    it('uses default router values', () => {
      const { mockRouter } = render(<TestComponent />);
      expect(mockRouter.push).toBeDefined();
      expect(mockRouter.replace).toBeDefined();
      expect(mockRouter.prefetch).toBeDefined();
      expect(mockRouter.back).toBeDefined();
      expect(mockRouter.forward).toBeDefined();
    });
  });

  describe('setup function', () => {
    it('provides userEvent and render result', () => {
      const { user, container, mockSignIn, mockSignOut } = setup(<TestComponent />);
      expect(user).toBeDefined();
      expect(container).toHaveTextContent('Test Component');
      expect(mockSignIn).toBeDefined();
      expect(mockSignOut).toBeDefined();
    });

    it('works with custom auth state', () => {
      const customAuthState = {
        loading: true,
        user: { uid: 'test-uid' } as any
      };
      const { user, container } = setup(<TestComponent />, { authState: customAuthState });
      expect(user).toBeDefined();
      expect(container).toHaveTextContent('Test Component');
    });

    it('works with custom router config', () => {
      const customRouter = {
        push: jest.fn(),
      };
      const { user, mockRouter } = setup(<TestComponent />, { routerConfig: customRouter });
      expect(user).toBeDefined();
      expect(mockRouter.push).toBeDefined();
    });
  });

  describe('next/navigation mocks', () => {
    it('mocks useRouter correctly', () => {
      const router = useRouter();
      expect(router.push).toBeDefined();
      expect(router.replace).toBeDefined();
      expect(router.prefetch).toBeDefined();
    });

    it('mocks usePathname correctly', () => {
      const pathname = usePathname();
      expect(pathname).toBe('/');
    });

    it('mocks useSearchParams correctly', () => {
      const searchParams = useSearchParams();
      expect(searchParams.get('callbackUrl')).toBe('/dashboard');
      expect(searchParams.get('nonexistent')).toBeNull();
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders component with default auth state (not authenticated)', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeTruthy();
  });

  it('renders component with authenticated user', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    } as any;

    render(<TestComponent requiresAuth />, {
      authState: { user: mockUser, loading: false },
    });

    expect(screen.getByText('Test Component')).toBeTruthy();
  });

  it('works with custom router configuration', () => {
    const mockPush = jest.fn();
    const { mockRouter } = render(<TestComponent />, {
      routerConfig: {
        pathname: ROUTES.DASHBOARD,
        push: mockPush,
      },
    });

    // Test that the router is properly configured
    expect(mockRouter.pathname).toBe(ROUTES.DASHBOARD);

    // Verify mock function was properly set up
    mockRouter.push('/test');
    expect(mockPush).toHaveBeenCalledWith('/test');
  });

  it('handles loading state correctly', () => {
    render(<TestComponent />, {
      authState: { user: null, loading: true },
    });

    expect(screen.getByText('Test Component')).toBeTruthy();
  });

  it('uses default router methods when not specified', () => {
    const { mockRouter } = render(<TestComponent />);

    mockRouter.push('/some-route');
    mockRouter.replace('/replace-route');
    mockRouter.back();
    mockRouter.forward();
    mockRouter.prefetch('/prefetch-route');

    // Just ensuring the functions can be called without errors
    expect(mockRouter.push).toHaveBeenCalledWith('/some-route');
    expect(mockRouter.replace).toHaveBeenCalledWith('/replace-route');
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.forward).toHaveBeenCalled();
    expect(mockRouter.prefetch).toHaveBeenCalledWith('/prefetch-route');
  });

  it('uses custom pathname when specified', () => {
    const customPathname = '/custom-path';

    // Render with custom pathname
    const { mockRouter } = render(<TestComponent />, {
      routerConfig: {
        pathname: customPathname,
      },
    });

    // Verify the pathname was set correctly
    expect(mockRouter.pathname).toBe(customPathname);
  });

  it('correctly overrides all router methods', () => {
    const mockRouterConfig = {
      pathname: '/custom-path',
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };

    const { mockRouter } = render(<TestComponent />, {
      routerConfig: mockRouterConfig,
    });

    mockRouter.push('/test-push');
    mockRouter.replace('/test-replace');
    mockRouter.back();
    mockRouter.forward();
    mockRouter.prefetch('/test-prefetch');

    expect(mockRouterConfig.push).toHaveBeenCalledWith('/test-push');
    expect(mockRouterConfig.replace).toHaveBeenCalledWith('/test-replace');
    expect(mockRouterConfig.back).toHaveBeenCalled();
    expect(mockRouterConfig.forward).toHaveBeenCalled();
    expect(mockRouterConfig.prefetch).toHaveBeenCalledWith('/test-prefetch');
  });

  it('works with partial router configuration', () => {
    const mockPush = jest.fn();

    const { mockRouter } = render(<TestComponent />, {
      routerConfig: {
        push: mockPush,
        // Not specifying other properties
      },
    });

    // Test that the router has the custom push but default pathname
    mockRouter.push('/partial-test');
    expect(mockPush).toHaveBeenCalledWith('/partial-test');
  });
});
