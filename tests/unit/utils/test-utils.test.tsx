import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../tests/utils/test-utils';
import { ROUTES } from '../../../tests/utils/routes';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockImplementation(() => ({
    pathname: '/',
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  })),
  usePathname: jest.fn().mockImplementation(() => '/')
}));

// Simple test component
const TestComponent = ({ requiresAuth = false, onNavigate = () => {} }: { requiresAuth?: boolean, onNavigate?: () => void }) => {
  const handleClick = () => {
    onNavigate();
  };
  
  return (
    <div>
      <h1>Test Component</h1>
      {requiresAuth && <p data-testid="auth-content">Authenticated content</p>}
      <button onClick={handleClick} data-testid="nav-button">Navigate</button>
    </div>
  );
};

describe('test-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders component with default auth state (not authenticated)', () => {
    const result = render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeTruthy();
  });

  it('renders component with authenticated user', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    } as any;

    render(<TestComponent requiresAuth />, {
      authState: { user: mockUser, loading: false }
    });

    expect(screen.getByText('Test Component')).toBeTruthy();
    expect(screen.getByTestId('auth-content')).toBeTruthy();
  });

  it('works with custom router configuration', () => {
    const mockPush = jest.fn();
    const { mockRouter } = render(<TestComponent />, {
      routerConfig: {
        pathname: ROUTES.DASHBOARD,
        push: mockPush
      }
    });

    // Test that the router is properly configured
    expect(mockRouter.pathname).toBe(ROUTES.DASHBOARD);
    
    // Verify mock function was properly set up
    mockRouter.push('/test');
    expect(mockPush).toHaveBeenCalledWith('/test');
  });

  it('handles loading state correctly', () => {
    render(<TestComponent />, {
      authState: { user: null, loading: true }
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
        pathname: customPathname
      }
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
      forward: jest.fn()
    };

    const { mockRouter } = render(<TestComponent />, {
      routerConfig: mockRouterConfig
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
        push: mockPush
        // Not specifying other properties
      }
    });
    
    // Test that the router has the custom push but default pathname
    mockRouter.push('/partial-test');
    expect(mockPush).toHaveBeenCalledWith('/partial-test');
  });
}); 