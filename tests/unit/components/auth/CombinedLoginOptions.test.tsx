import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CombinedLoginOptions } from '@/components/auth/CombinedLoginOptions';
import { signIn } from 'next-auth/react';

// --- Mocks ---

// Mock CssBaseline as it might be causing issues
jest.mock('@mui/material/CssBaseline', () => () => <></>); // Mock as a simple fragment

// Mock problematic MUI layout components to bypass JSDOM rendering issues
jest.mock('@mui/material/Card', () => ({ children, ...props }: { children: React.ReactNode }) => (
  <div {...props}>{children}</div>
));
jest.mock(
  '@mui/material/CardHeader',
  () =>
    ({ title, subheader }: { title?: React.ReactNode; subheader?: React.ReactNode }) => (
      <div>
        {title}
        {subheader}
      </div>
    )
);
jest.mock(
  '@mui/material/CardContent',
  () =>
    ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>
);
jest.mock(
  '@mui/material/Divider',
  () =>
    ({ children, ...props }: { children?: React.ReactNode }) => <div {...props}>{children}</div>
);

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({
    status: 'unauthenticated',
    data: null,
    update: jest.fn(),
  })),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create a simple test wrapper component to render CombinedLoginOptions
const TestWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Mock the CredentialsLoginForm component to isolate testing
jest.mock('@/components/auth/CredentialsLoginForm', () => ({
  CredentialsLoginForm: ({
    setIsLoading,
    setError,
  }: {
    setIsLoading: (value: boolean) => void;
    setError: (value: string | null) => void;
  }) => (
    <div data-testid="credentials-form">
      <input type="email" aria-label="Email Address" data-testid="email-input" />
      <input type="password" aria-label="Password" data-testid="password-input" />
      <button
        data-testid="email-signin-button"
        onClick={() => {
          setIsLoading(true);
          signIn('credentials', {
            redirect: false,
            email: 'test@example.com',
            password: 'password123',
          }).then(result => {
            if (result?.error) {
              setError(
                result.error === 'CredentialsSignin'
                  ? 'Invalid email or password.'
                  : 'Login failed. Please check your details or try another method.'
              );
            }
            setIsLoading(false);
          });
        }}
      >
        Sign in with Email
      </button>
      <div role="alert" data-testid="error-message" style={{ display: 'none' }}>
        Error message placeholder
      </div>
    </div>
  ),
}));

// --- Test Suite ---
describe('CombinedLoginOptions Component', () => {
  // Get mock references typed correctly
  const mockedSignIn = signIn as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // --- Helper Functions ---
  const renderComponent = () => {
    return render(
      <TestWrapper>
        <CombinedLoginOptions />
      </TestWrapper>
    );
  };

  // --- Test Cases ---
  it('should render initial state correctly', () => {
    renderComponent();
    expect(screen.getByTestId('credentials-form')).toBeInTheDocument();
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
  });

  it('should handle Google sign-in click', async () => {
    renderComponent();

    // Click the Google button
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.click(googleButton);

    // Verify Google sign-in was triggered
    expect(mockedSignIn).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({
        callbackUrl: '/dashboard',
      })
    );
  });
});

// Helper to add role="alert" to the Typography component used for errors
// This helps screen readers announce errors.
// We can't directly modify the component, so we check the role in tests.
const OriginalTypography = jest.requireActual('@mui/material/Typography').default;
jest.mock('@mui/material/Typography', () => (props: any) => {
  if (props.color === 'error') {
    return <OriginalTypography {...props} role="alert" />;
  }
  return <OriginalTypography {...props} />;
});
