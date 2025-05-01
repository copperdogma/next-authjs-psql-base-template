import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';
import UserProfile from '../../../components/auth/UserProfile';
import { useUserStore } from '@/lib/store/userStore';
import React from 'react';

// Mock Next.js components
jest.mock('next/link', () => ({
  __esModule: true,
  default: function Link({ children }: { children: ReactNode; [key: string]: any }) {
    return <>{children}</>;
  },
}));

jest.mock('@mui/icons-material/Person', () => ({
  __esModule: true,
  default: (props: any) => <svg data-testid="PersonIcon" {...props} />,
}));

describe('UserProfile', () => {
  const originalState = useUserStore.getState();

  beforeEach(() => {
    useUserStore.setState(originalState, true);
    jest.clearAllMocks();
  });

  test('renders nothing when user is not authenticated (no ID in store)', () => {
    render(<UserProfile />);
    const profileChip = screen.queryByTestId('user-profile-chip');
    expect(profileChip).not.toBeInTheDocument();
  });

  test('renders authenticated user information correctly with image', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/photo.jpg',
    };
    useUserStore.setState(mockUser);

    render(<UserProfile />);

    const profileChip = screen.getByTestId('user-profile-chip');
    expect(profileChip).toBeInTheDocument();

    const avatarImg = within(profileChip).getByRole('img');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', mockUser.image);

    const displayName = within(profileChip).getByText(mockUser.name!);
    expect(displayName).toBeInTheDocument();
  });

  test('renders avatar with initials when user has no image', () => {
    const mockUserNoImage = {
      id: 'user-456',
      name: 'Test User No Image',
      email: 'test-no-image@example.com',
      image: null,
    };
    useUserStore.setState(mockUserNoImage);

    render(<UserProfile />);

    const profileChip = screen.getByTestId('user-profile-chip');
    expect(profileChip).toBeInTheDocument();

    const displayName = within(profileChip).getByText(mockUserNoImage.name!);
    expect(displayName).toBeInTheDocument();

    const fallbackIcon = within(profileChip).getByTestId('PersonIcon');
    expect(fallbackIcon).toBeInTheDocument();
  });

  test('uses email as display name when name is not available', () => {
    const mockUserNoName = {
      id: 'user-789',
      name: null,
      email: 'test-no-name@example.com',
      image: null,
    };
    useUserStore.setState(mockUserNoName);

    render(<UserProfile />);

    const profileChip = screen.getByTestId('user-profile-chip');
    expect(profileChip).toBeInTheDocument();

    const displayName = within(profileChip).getByText(mockUserNoName.email!);
    expect(displayName).toBeInTheDocument();

    const fallbackIcon = within(profileChip).getByTestId('PersonIcon');
    expect(fallbackIcon).toBeInTheDocument();
  });

  test('renders nothing when user is explicitly unauthenticated', () => {
    useUserStore.setState({ id: null, name: null, email: null, image: null });
    render(<UserProfile />);
    const profileChip = screen.queryByTestId('user-profile-chip');
    expect(profileChip).not.toBeInTheDocument();
  });
});
