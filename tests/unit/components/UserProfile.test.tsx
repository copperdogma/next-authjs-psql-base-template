import { jsx as _jsx } from 'react/jsx-runtime';
import { render, screen } from '../../utils/test-utils'
import '@testing-library/jest-dom'
import UserProfile from '../../../components/auth/UserProfile'
import { User } from 'firebase/auth'

// Mock Firebase auth
jest.mock('../../../lib/firebase', () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  }

  return {
    auth: mockAuth,
  }
})

const mockFirebase = jest.requireMock('../../../lib/firebase')

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

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFirebase.auth.currentUser = null
  })

  it('renders loading state when not client side', () => {
    render(<UserProfile />, {
      authState: { user: null, loading: false, isClientSide: false }
    });
    
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
  });

  it('renders authenticated user information correctly', () => {
    render(<UserProfile />, {
      authState: { user: mockUser, loading: false, isClientSide: true }
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent('https://example.com/photo.jpg'))
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile');
  });

  it('handles missing user information gracefully', () => {
    const userWithoutInfo = {
      ...mockUser,
      displayName: null,
      photoURL: null
    } as unknown as User;

    render(<UserProfile />, {
      authState: { user: userWithoutInfo, loading: false, isClientSide: true }
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Anonymous');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile');
  });

  it('renders nothing when user is not authenticated', () => {
    render(<UserProfile />, {
      authState: { user: null, loading: false, isClientSide: true }
    });

    expect(screen.queryByTestId('profile-name')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
}) 