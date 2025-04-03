import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';
import UserProfile from '../../../components/auth/UserProfile';
import { useSession } from 'next-auth/react';
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

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state when authentication is loading', () => {
    // Mock the useSession hook to return loading state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    // Render the component
    render(<UserProfile />);

    // Assert loading state is shown
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
  });

  test('renders authenticated user information correctly with image', () => {
    // Mock the useSession hook to return authenticated state with image
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/photo.jpg',
        },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    // Render the component
    render(<UserProfile />);

    // Assert user information is shown correctly
    const userName = screen.getByTestId('profile-name');
    const profileButton = screen.getByTestId('user-profile');
    const profileImage = screen.getByTestId('profile-image');

    expect(userName).toHaveTextContent('Test User');
    expect(profileButton).toHaveAttribute('href', '/profile');
    expect(profileImage).toBeInTheDocument();
  });

  test('renders avatar with initials when user has no image', () => {
    // Mock the useSession hook to return authenticated state without image
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    // Render the component
    render(<UserProfile />);

    // Assert avatar with initials is shown
    const userName = screen.getByTestId('profile-name');
    const profileButton = screen.getByTestId('user-profile');
    const profileImage = screen.queryByTestId('profile-image');
    const avatar = screen.getByText('T'); // Gets the avatar with the initial 'T'

    expect(userName).toHaveTextContent('Test User');
    expect(profileButton).toHaveAttribute('href', '/profile');
    expect(profileImage).not.toBeInTheDocument();
    expect(avatar).toBeInTheDocument();
  });

  test('uses email initial when name is not available', () => {
    // Mock the useSession hook to return authenticated state with only email
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: null,
          email: 'test@example.com',
          image: null,
        },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    // Render the component
    render(<UserProfile />);

    // Assert avatar with email initial is shown
    const userName = screen.getByTestId('profile-name');
    const avatar = screen.getByText('T'); // Gets the avatar with the initial 'T'

    expect(userName).toHaveTextContent('User Profile');
    expect(avatar).toBeInTheDocument();
  });

  test('renders nothing when user is not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // Render the component
    render(<UserProfile />);

    // Assert nothing is rendered
    const profileButton = screen.queryByTestId('user-profile');
    const userName = screen.queryByTestId('profile-name');

    expect(profileButton).not.toBeInTheDocument();
    expect(userName).not.toBeInTheDocument();
  });
});
