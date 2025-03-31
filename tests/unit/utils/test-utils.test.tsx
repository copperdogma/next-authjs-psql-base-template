import { screen } from '@testing-library/react';
import { render, setup } from '../../utils/test-utils';
import { ROUTES } from '../../utils/routes';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TestUtils } from '../../utils/test-utils';

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
        user: { uid: 'test-uid' } as any,
      };
      const { container } = render(<TestComponent />, { authState: customAuthState });
      expect(container).toHaveTextContent('Test Component');
    });

    it('renders with custom router config', () => {
      const customRouter = {
        push: jest.fn(),
      };
      const { mockRouter } = render(<TestComponent />, { routerConfig: customRouter });
      expect(mockRouter!.push).toBeDefined();
    });

    it('uses default router values', () => {
      const { mockRouter } = render(<TestComponent />);
      expect(mockRouter!.push).toBeDefined();
      expect(mockRouter!.replace).toBeDefined();
      expect(mockRouter!.prefetch).toBeDefined();
      expect(mockRouter!.back).toBeDefined();
      expect(mockRouter!.forward).toBeDefined();
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
        user: { uid: 'test-uid' } as any,
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
      expect(mockRouter!.push).toBeDefined();
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
      if (searchParams) {
        expect(searchParams.get('callbackUrl')).toBe('/dashboard');
        expect(searchParams.get('nonexistent')).toBeNull();
      } else {
        fail('searchParams should be defined');
      }
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
    expect(mockRouter!.pathname).toBe(ROUTES.DASHBOARD);

    // Verify mock function was properly set up
    mockRouter!.push('/test');
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

    mockRouter!.push('/some-route');
    mockRouter!.replace('/replace-route');
    mockRouter!.back();
    mockRouter!.forward();
    mockRouter!.prefetch('/prefetch-route');

    // Just ensuring the functions can be called without errors
    expect(mockRouter!.push).toHaveBeenCalledWith('/some-route');
    expect(mockRouter!.replace).toHaveBeenCalledWith('/replace-route');
    expect(mockRouter!.back).toHaveBeenCalled();
    expect(mockRouter!.forward).toHaveBeenCalled();
    expect(mockRouter!.prefetch).toHaveBeenCalledWith('/prefetch-route');
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
    expect(mockRouter!.pathname).toBe(customPathname);
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

    mockRouter!.push('/test-push');
    mockRouter!.replace('/test-replace');
    mockRouter!.back();
    mockRouter!.forward();
    mockRouter!.prefetch('/test-prefetch');

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
    mockRouter!.push('/partial-test');
    expect(mockPush).toHaveBeenCalledWith('/partial-test');
  });

  describe('TestUtils helper functions', () => {
    it('queryByTestId returns element by data-testid', () => {
      const { container } = render(
        <div>
          <span data-testid="test-element">Test Element</span>
        </div>
      );

      const element = TestUtils.queryByTestId(container, 'test-element');
      expect(element).toBeTruthy();
      expect(element?.textContent).toBe('Test Element');
    });

    it('queryByTestId returns null for non-existent elements', () => {
      const { container } = render(<div>No matching element</div>);

      const element = TestUtils.queryByTestId(container, 'non-existent');
      expect(element).toBeNull();
    });

    it('findByTestId returns element by data-testid', async () => {
      const { container } = render(
        <div>
          <span data-testid="test-element">Test Element</span>
        </div>
      );

      const element = await TestUtils.findByTestId(container, 'test-element');
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('Test Element');
    });

    it('findByTestId throws error for non-existent elements', async () => {
      const { container } = render(<div>No matching element</div>);

      await expect(TestUtils.findByTestId(container, 'non-existent')).rejects.toThrow(
        'Element with data-testid="non-existent" not found'
      );
    });

    it('delay function waits for specified milliseconds', async () => {
      jest.useFakeTimers();

      const mockFn = jest.fn();
      const promise = TestUtils.delay(1000).then(mockFn);

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(999);
      await Promise.resolve(); // Let any pending promises resolve
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await Promise.resolve(); // Let any pending promises resolve
      expect(mockFn).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('createUser returns a mock user with expected properties', () => {
      const user = TestUtils.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      // Removed expectation for getIdToken which doesn't exist on NextAuth user
    });
  });

  describe('Rendering utility functions', () => {
    it('renderWithProviders provides user event', () => {
      const { user } = TestUtils.renderWithProviders(<TestComponent />);
      expect(user).toBeDefined();
    });

    it('renderAuthenticatedComponent provides authenticated session', () => {
      const { container } = TestUtils.renderAuthenticatedComponent(
        <div data-testid="auth-component">Authenticated Component</div>
      );

      expect(container).toHaveTextContent('Authenticated Component');
      // Session provider mock is passed through in tests
    });

    it('renderUnauthenticatedComponent provides null session', () => {
      const { container } = TestUtils.renderUnauthenticatedComponent(
        <div data-testid="unauth-component">Unauthenticated Component</div>
      );

      expect(container).toHaveTextContent('Unauthenticated Component');
      // Session provider mock is passed through in tests
    });
  });

  describe('Error handling and edge cases', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('handles error suppression in normal usage', () => {
      // Save original for restoration later
      const originalConsoleError = console.error;

      // Create a mock we can inspect
      const spy = jest.fn();

      // Create a hybrid that both calls the spy and performs the original behavior
      console.error = (...args) => {
        spy(...args);
        if (
          args[0] &&
          typeof args[0] === 'string' &&
          (args[0].includes('port.postMessage') || args[0].includes('act(...)'))
        ) {
          return; // Suppress
        }
        // Don't actually call originalConsoleError to avoid test noise
      };

      // Test the suppression logic directly
      console.error('Error with port.postMessage in it');
      console.error('Error with act(...) in it');
      console.error('Regular error');

      // Verify all were called on our spy
      expect(spy).toHaveBeenCalledTimes(3);

      // But the rendering function would have filtered two of them
      expect(spy).toHaveBeenCalledWith('Error with port.postMessage in it');
      expect(spy).toHaveBeenCalledWith('Error with act(...) in it');
      expect(spy).toHaveBeenCalledWith('Regular error');

      // Restore
      console.error = originalConsoleError;
    });

    it('handles a component that triggers user interaction', async () => {
      const onNavigateMock = jest.fn();
      const { user } = setup(<TestComponent onNavigate={onNavigateMock} />);

      const button = screen.getByTestId('nav-button');
      await user.click(button);

      expect(onNavigateMock).toHaveBeenCalled();
    });

    it('handles components with various route configurations', () => {
      // Test with pathname only
      const { mockRouter: router1 } = render(<TestComponent />, {
        routerConfig: { pathname: '/custom' },
      });
      expect(router1?.pathname).toBe('/custom');

      // Test with search params present
      jest.requireMock('next/navigation').useSearchParams.mockImplementationOnce(() => {
        const params = new URLSearchParams();
        params.set('test', 'value');
        return params;
      });

      const { mockRouter: router2 } = render(<TestComponent />);
      const searchParams = useSearchParams();
      expect(searchParams?.get('test')).toBe('value');
    });

    it('resets mock functions between renders', () => {
      // First render to setup mocks
      const { mockSignIn: signIn1, mockSignOut: signOut1 } = render(<TestComponent />);

      // Call the mocks
      signIn1('google');
      signOut1();

      expect(signIn1).toHaveBeenCalledWith('google');
      expect(signOut1).toHaveBeenCalled();

      // Second render should reset mocks
      const { mockSignIn: signIn2, mockSignOut: signOut2 } = render(<TestComponent />);

      expect(signIn2).not.toHaveBeenCalled();
      expect(signOut2).not.toHaveBeenCalled();
    });

    it('provides access to the router object', () => {
      const { mockRouter } = setup(<TestComponent />);

      expect(mockRouter).toBeDefined();
      expect(typeof mockRouter?.push).toBe('function');
      expect(typeof mockRouter?.replace).toBe('function');
      expect(typeof mockRouter?.back).toBe('function');
      expect(typeof mockRouter?.forward).toBe('function');
      expect(typeof mockRouter?.prefetch).toBe('function');
      expect(mockRouter?.pathname).toBe('/');
    });
  });
});
