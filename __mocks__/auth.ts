import { type User as NextAuthUser, type Account } from 'next-auth';
import { type AdapterUser } from '@auth/core/adapters';
import { type JWT } from '@auth/core/jwt';
import { UserRole } from '@/types';

// Mock User that satisfies both NextAuthUser and AdapterUser requirements
export const createMockUser = (
  overrides: Partial<NextAuthUser & AdapterUser> = {}
): NextAuthUser & AdapterUser => ({
  id: `user-${Math.random().toString(36).substring(2, 15)}`,
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  emailVerified: null,
  role: UserRole.USER,
  ...overrides,
});

// Mock Account based on definition in tests/unit/lib/auth/auth-jwt.test.ts
export const createMockAccount = (provider: string, overrides: Partial<Account> = {}): Account => ({
  provider: provider,
  type: 'oauth',
  providerAccountId: `acc-${Math.random().toString(36).substring(2, 15)}`,
  access_token: 'mock_access_token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  scope: 'openid profile email',
  token_type: 'bearer',
  id_token: 'mock_id_token',
  ...overrides,
});

// Mock JWT
export const createMockToken = (overrides: Partial<JWT> = {}): JWT => ({
  sub: `user-${Math.random().toString(36).substring(2, 15)}`,
  name: 'Test User Token Name',
  email: 'test-token@example.com',
  picture: null,
  role: UserRole.USER,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: `jwt-${Math.random().toString(36).substring(2, 15)}`,
  ...overrides,
});
