import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store/userStore';
import ProfileContent from '../../../app/profile/components/ProfileContent';
import React from 'react';

// Mock the UI logger to prevent actual logging during tests
jest.mock('@/lib/logger', () => ({
  loggers: {
    ui: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock the Zustand store
jest.mock('@/lib/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

// Mock the ProfileErrorState component with a test-friendly implementation
jest.mock('../../../app/profile/components/ProfileErrorState', () => {
  return function MockProfileErrorState() {
    return <div data-testid="profile-error-state">Profile Error State</div>;
  };
});

// Mock the ProfileLoadingState component
jest.mock('../../../app/profile/components/ProfileLoadingState', () => {
  return function MockProfileLoadingState() {
    return <div data-testid="profile-loading-state">Loading profile data...</div>;
  };
});

// Mock MUI Paper component
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Paper: ({ children, ...props }: any) => (
    <div data-testid="profile-paper" {...props}>
      {children}
    </div>
  ),
  Box: ({ children, ...props }: any) => (
    <div data-testid="profile-box" {...props}>
      {children}
    </div>
  ),
}));

// Mock the profile sub-components
jest.mock('../../../app/profile/components/ProfileAvatarSection', () => {
  return function MockProfileAvatarSection() {
    return <div data-testid="profile-avatar-section">Avatar Section</div>;
  };
});

jest.mock('../../../app/profile/components/ProfileDetailsSection', () => {
  return function MockProfileDetailsSection() {
    return <div data-testid="profile-details-section">Details Section</div>;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;

describe('ProfileContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ProfileLoadingState when session status is loading', () => {
    // Mock session as loading
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    // Mock user store with no data
    mockUseUserStore.mockReturnValue({
      id: null,
      name: null,
      email: null,
      image: null,
      role: null,
    });

    render(<ProfileContent />);

    expect(screen.getByTestId('profile-loading-state')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-error-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-paper')).not.toBeInTheDocument();
  });

  it('should render ProfileErrorState when session is authenticated but user ID is missing from store', () => {
    // Mock session as authenticated
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER' as any,
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock user store with missing ID (this is the key test case)
    mockUseUserStore.mockReturnValue({
      id: null, // This is the critical condition - session exists but store has no ID
      name: null,
      email: null,
      image: null,
      role: null,
    });

    render(<ProfileContent />);

    expect(screen.getByTestId('profile-error-state')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-loading-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-paper')).not.toBeInTheDocument();
  });

  it('should render ProfileErrorState when session is unauthenticated and user ID is missing from store', () => {
    // Mock session as unauthenticated
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    // Mock user store with missing ID
    mockUseUserStore.mockReturnValue({
      id: null,
      name: null,
      email: null,
      image: null,
      role: null,
    });

    render(<ProfileContent />);

    expect(screen.getByTestId('profile-error-state')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-loading-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-paper')).not.toBeInTheDocument();
  });

  it('should render profile content when session is authenticated and user data is available in store', () => {
    // Mock session as authenticated
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER' as any,
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock user store with complete user data
    mockUseUserStore.mockReturnValue({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.png',
      role: 'USER',
    });

    render(<ProfileContent />);

    expect(screen.getByTestId('profile-paper')).toBeInTheDocument();
    expect(screen.getByTestId('profile-avatar-section')).toBeInTheDocument();
    expect(screen.getByTestId('profile-details-section')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-error-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-loading-state')).not.toBeInTheDocument();
  });

  it('should handle partial user data in store when session is authenticated', () => {
    // Mock session as authenticated
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER' as any,
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock user store with minimal data (just ID, which is sufficient)
    mockUseUserStore.mockReturnValue({
      id: 'test-user-id',
      name: null,
      email: null,
      image: null,
      role: null,
    });

    render(<ProfileContent />);

    expect(screen.getByTestId('profile-paper')).toBeInTheDocument();
    expect(screen.getByTestId('profile-avatar-section')).toBeInTheDocument();
    expect(screen.getByTestId('profile-details-section')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-error-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-loading-state')).not.toBeInTheDocument();
  });
});
