import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReactNode } from 'react'
import UserProfile from '../../../components/auth/UserProfile'
import type { User } from '@firebase/auth'
import { AuthContext } from '../../../app/providers/AuthProvider'
import React from 'react'

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: function Link({ 
    href, 
    children, 
    ...props 
  }: { 
    href: string; 
    children: ReactNode; 
    [key: string]: any 
  }) {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock Firebase auth
jest.mock('../../../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn(),
    }
  }
});

// Mock user data
const mockUser = {
  displayName: 'Test User',
  email: 'test@example.com',
  uid: 'test-user-id',
  emailVerified: false,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  phoneNumber: null,
  photoURL: 'https://example.com/photo.jpg',
  providerId: 'google.com',
  delete: () => Promise.resolve(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: () => Promise.resolve({
    token: '',
    signInProvider: null,
    signInSecondFactor: null,
    expirationTime: '',
    issuedAtTime: '',
    authTime: '',
    claims: {}
  }),
  reload: () => Promise.resolve(),
  toJSON: () => ({})
} as unknown as User;

// Define a wrapper component for testing
const Wrapper = ({ children, value }: { children: ReactNode, value: any }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

// Mock useEffect to prevent hydration errors in tests
const originalUseEffect = React.useEffect;
jest.spyOn(React, 'useEffect').mockImplementation((callback, deps) => {
  // Immediately invoke the mounting useEffect callback
  if (deps && deps.length === 0) {
    callback();
    return () => {}; // Return empty cleanup function
  }
  // For other useEffects with dependencies, use the original
  return originalUseEffect(callback, deps);
});

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    (React.useEffect as jest.Mock).mockImplementation((callback, deps) => {
      if (deps && deps.length === 0) {
        callback();
        return () => {};
      }
      return originalUseEffect(callback, deps);
    });
  });

  afterAll(() => {
    // Restore the original useEffect
    (React.useEffect as jest.Mock).mockRestore();
  });

  it('renders loading state when component is loading', () => {
    render(<UserProfile />, {
      wrapper: (props) => (
        <Wrapper value={{ user: null, loading: true }}>
          {props.children}
        </Wrapper>
      )
    });
    
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
  });

  it('renders authenticated user information correctly', () => {
    render(<UserProfile />, {
      wrapper: (props) => (
        <Wrapper value={{ user: mockUser, loading: false }}>
          {props.children}
        </Wrapper>
      )
    });
    
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('profile-image')).toHaveAttribute(
      'src',
      mockUser.photoURL
    );
    expect(screen.getByRole('button')).toHaveAttribute('href', '/profile');
  });

  it('handles missing user information gracefully', () => {
    const userWithoutInfo = {
      ...mockUser,
      displayName: null,
      photoURL: null
    } as unknown as User;

    render(<UserProfile />, {
      wrapper: (props) => (
        <Wrapper value={{ user: userWithoutInfo, loading: false }}>
          {props.children}
        </Wrapper>
      )
    });
    
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Anonymous');
    expect(screen.queryByTestId('profile-image')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('href', '/profile');
  });

  it('renders nothing when user is not authenticated', () => {
    render(<UserProfile />, {
      wrapper: (props) => (
        <Wrapper value={{ user: null, loading: false }}>
          {props.children}
        </Wrapper>
      )
    });
    
    expect(screen.queryByTestId('profile-name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
}) 