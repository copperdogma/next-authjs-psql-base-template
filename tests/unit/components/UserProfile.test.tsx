import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';
import UserProfile from '../../../components/auth/UserProfile';
import type { User } from '@firebase/auth';
import { AuthContext } from '../../../app/providers/AuthProvider';
import React from 'react';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return <img {...props} alt={props.alt || ''} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function Link({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: any;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock Firebase auth
jest.mock('../../../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn((_, callback) => {
        // Simulate initial auth state
        callback(null);
        // Return unsubscribe function
        return jest.fn();
      }),
    },
  };
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
  getIdTokenResult: () =>
    Promise.resolve({
      token: '',
      signInProvider: null,
      signInSecondFactor: null,
      expirationTime: '',
      issuedAtTime: '',
      authTime: '',
      claims: {},
    }),
  reload: () => Promise.resolve(),
  toJSON: () => ({}),
} as unknown as User;

// Define a wrapper component for testing
const Wrapper = ({ children, value }: { children: ReactNode; value: any }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when component is loading', () => {
    // Arrange
    const authState = { user: null, loading: true };
    const wrapper = (props: { children: ReactNode }) => (
      <Wrapper value={authState}>{props.children}</Wrapper>
    );

    // Act
    render(<UserProfile />, { wrapper });

    // Assert
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
  });

  it('renders authenticated user information correctly', () => {
    // Arrange
    const authState = { user: mockUser, loading: false };
    const wrapper = (props: { children: ReactNode }) => (
      <Wrapper value={authState}>{props.children}</Wrapper>
    );

    // Act
    render(<UserProfile />, { wrapper });

    // Assert
    const userName = screen.getByTestId('profile-name');
    const profileButton = screen.getByTestId('user-profile');
    const profileImage = screen.getByTestId('profile-image');

    expect(userName).toHaveTextContent('Test User');
    expect(profileButton).toHaveAttribute('href', '/profile');
    expect(profileImage).toBeInTheDocument();
  });

  it('handles missing user information gracefully', () => {
    // Arrange
    const userWithoutInfo = {
      ...mockUser,
      displayName: null,
      photoURL: null,
    } as unknown as User;
    const authState = { user: userWithoutInfo, loading: false };
    const wrapper = (props: { children: ReactNode }) => (
      <Wrapper value={authState}>{props.children}</Wrapper>
    );

    // Act
    render(<UserProfile />, { wrapper });

    // Assert
    const userName = screen.getByTestId('profile-name');
    const profileButton = screen.getByTestId('user-profile');
    const profileImage = screen.queryByTestId('profile-image');

    expect(userName).toHaveTextContent('Anonymous');
    expect(profileButton).toHaveAttribute('href', '/profile');
    expect(profileImage).not.toBeInTheDocument();
  });

  it('renders nothing when user is not authenticated', () => {
    // Arrange
    const authState = { user: null, loading: false };
    const wrapper = (props: { children: ReactNode }) => (
      <Wrapper value={authState}>{props.children}</Wrapper>
    );

    // Act
    render(<UserProfile />, { wrapper });

    // Assert
    const profileButton = screen.queryByTestId('user-profile');
    const userName = screen.queryByTestId('profile-name');

    expect(profileButton).not.toBeInTheDocument();
    expect(userName).not.toBeInTheDocument();
  });
});
