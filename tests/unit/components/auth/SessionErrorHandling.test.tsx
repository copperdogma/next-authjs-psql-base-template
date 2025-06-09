import React from 'react';
import { render, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import SessionProviderWrapper from '@/app/providers/SessionProviderWrapper';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define a test-specific type for the test trigger function
type TestSessionErrorTrigger = (message: string) => void;

// Variable to store our error trigger function
let triggerSessionError: TestSessionErrorTrigger | null = null;

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/client-logger', () => ({
  clientLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    }),
  },
}));

jest.mock('@/lib/store/userStore', () => ({
  useUserStore: () => ({
    setUserDetails: jest.fn(),
    clearUserDetails: jest.fn(),
  }),
}));

// Create a manual mock of the SessionErrorHandler that directly simulates error triggering
jest.mock('@/app/providers/SessionErrorHandler', () => {
  return {
    __esModule: true,
    default: ({
      setSessionError,
    }: {
      sessionError: Error | null;
      setSessionError: (error: Error | null) => void;
    }) => {
      // Store the error setter function in our module-scoped variable
      triggerSessionError = (message: string) => {
        setSessionError(new Error(message));
      };
      return null;
    },
  };
});

describe('Session Error Handling Integration', () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    triggerSessionError = null;

    // Setup default mocks
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it('renders children when no session error occurs', () => {
    render(
      <SessionProviderWrapper session={null}>
        <div data-testid="test-child">Test Child</div>
      </SessionProviderWrapper>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.queryByText('Session Error')).not.toBeInTheDocument();
  });

  it('displays error message when session error is triggered', async () => {
    render(
      <SessionProviderWrapper session={null}>
        <div data-testid="test-child">Test Child</div>
      </SessionProviderWrapper>
    );

    // Trigger the session error using our test trigger function
    act(() => {
      if (triggerSessionError) {
        triggerSessionError('Failed to initialize session');
      }
    });

    // Check that the error message is displayed
    expect(await screen.findByText('Session Error')).toBeInTheDocument();
    expect(
      screen.getByText('There was a problem loading your session. Trying to recover...')
    ).toBeInTheDocument();
  });

  // Clean up spies after tests
  afterAll(() => {
    jest.restoreAllMocks();
    triggerSessionError = null;
  });
});
