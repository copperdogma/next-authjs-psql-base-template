import { UserRole } from '@/types';
import type { AdapterUser } from 'next-auth/adapters';
import type { User as NextAuthUser } from 'next-auth';

// Define the types we need for the mocks
export type AuthUserInternal = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
};

export type FindOrCreateUserParams = {
  email: string;
  profileData: { id: string; name?: string | null; email: string; image?: string | null };
  providerAccountId: string;
  provider: string;
  correlationId: string;
};

export type ValidateSignInResult = {
  isValid: boolean;
  userId?: string | null;
  userEmail?: string | null;
};

// Create mock implementations
export const findOrCreateUserAndAccountInternal = jest.fn().mockImplementation(
  async (): Promise<AuthUserInternal | null> => ({
    id: 'mock-user-id',
    name: 'Mock User',
    email: 'mock@example.com',
    image: 'https://example.com/avatar.jpg',
    role: UserRole.USER,
  })
);

export const prepareProfileDataForDb = jest
  .fn()
  .mockImplementation(
    (
      userId: string,
      userEmail: string
    ): { id: string; name?: string | null; email: string; image?: string | null } => ({
      id: userId,
      email: userEmail,
      name: 'Mock User',
      image: 'https://example.com/avatar.jpg',
    })
  );

export const validateSignInInputs = jest
  .fn()
  .mockImplementation(
    (
      user: NextAuthUser | AdapterUser | null | undefined,
      account: { provider: string; providerAccountId: string } | null | undefined
    ): ValidateSignInResult => {
      if (!user?.id || !user?.email || !account?.provider) {
        return { isValid: false };
      }
      return {
        isValid: true,
        userId: user.id,
        userEmail: user.email,
      };
    }
  );
