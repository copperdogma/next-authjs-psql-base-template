import { jsx as _jsx } from 'react/jsx-runtime';
import { render } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider';
import type { User } from '@firebase/auth';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
}))

type AuthState = {
  user: User | null;
  loading: boolean;
  isClientSide: boolean;
};

// Create a custom render function that includes providers
function customRender(
  ui: ReactElement,
  options: { authState?: AuthState } = {}
) {
  const defaultAuthState = { user: null, loading: false, isClientSide: true };
  const authState = options.authState || defaultAuthState;

  return {
    ...render(
      <AuthContext.Provider value={authState}>
        {ui}
      </AuthContext.Provider>
    ),
    mockRouter,
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render } 