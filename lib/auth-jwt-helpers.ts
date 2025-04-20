import { type JWT } from '@auth/core/jwt';
import { type Account, type Profile, type User as NextAuthUser } from 'next-auth';
import { type AdapterUser } from 'next-auth/adapters';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';
import {
  type AuthUserInternal,
  type HandleJwtSignInParams,
  type ValidateSignInResult,
  findOrCreateUserAndAccountInternal, // Import the necessary helper from the original file
} from './auth-helpers'; // Assuming the original file is in the same directory

// ====================================
// JWT Callback Helper Functions
// ====================================

// Helper to validate signIn inputs
export function validateSignInInputs(
  user: NextAuthUser | AdapterUser | null | undefined,
  account: Account | null | undefined,
  correlationId: string
): ValidateSignInResult {
  if (!user?.id || !user?.email) {
    logger.warn({ msg: 'Missing user ID or email during sign-in', user, correlationId });
    return { isValid: false };
  }
  if (!account?.provider || !account?.providerAccountId) {
    logger.warn({ msg: 'Missing account provider or providerAccountId', account, correlationId });
    return { isValid: false };
  }
  return { isValid: true, userId: user.id, userEmail: user.email };
}

// Helper to build the final JWT
export function buildNewJwt(token: JWT, dbUser: AuthUserInternal): JWT {
  return {
    ...token,
    sub: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
    picture: dbUser.image,
  };
}

// Helper to prepare profile data for DB insertion/update
// eslint-disable-next-line complexity
export function _prepareProfileDataForDb(
  userId: string,
  userEmail: string,
  profile: Profile | null | undefined,
  user: NextAuthUser | AdapterUser | null | undefined
): { id: string; name?: string | null; email: string; image?: string | null } {
  let name: string | null = null;
  if (profile?.name) {
    name = profile.name;
  } else if (user?.name) {
    name = user.name;
  }

  let image: string | null = null;
  if (profile?.image && typeof profile.image === 'string') {
    image = profile.image;
  } else if (user?.image && typeof user.image === 'string') {
    image = user.image;
  }

  return {
    id: userId,
    email: userEmail,
    name: name,
    image: image,
  };
}

// Helper function for JWT signIn trigger
export async function handleJwtSignIn(params: HandleJwtSignInParams): Promise<JWT> {
  const { token, user, account, profile, correlationId } = params;

  const validation = validateSignInInputs(user, account, correlationId);
  if (!validation.isValid || !validation.userId || !validation.userEmail) {
    return {}; // Return empty token if validation fails
  }

  if (!account || !user) {
    logger.error({
      msg: 'Account or User object unexpectedly missing after validation',
      correlationId,
    });
    return {};
  }

  const { userId, userEmail } = validation;
  logger.info({
    msg: 'Initial sign-in detected',
    userId,
    provider: account.provider,
    correlationId,
  });

  const profileDataForDb = _prepareProfileDataForDb(userId, userEmail, profile, user);

  // Use the renamed internal helper from auth-helpers.ts
  const dbUser = await findOrCreateUserAndAccountInternal({
    email: userEmail,
    profileData: profileDataForDb,
    providerAccountId: account.providerAccountId,
    provider: account.provider,
    correlationId,
  });

  if (!dbUser) {
    logger.error({
      msg: 'Failed find/create user during sign-in',
      email: userEmail,
      provider: account.provider,
      correlationId,
    });
    return {};
  }

  return buildNewJwt(token, dbUser);
}

// Helper function for JWT update trigger
export async function handleJwtUpdate(token: JWT, correlationId: string): Promise<JWT> {
  if (!token.sub) {
    logger.warn({ msg: 'JWT update trigger skipped, missing sub (user ID)', correlationId });
    return token;
  }

  logger.info({ msg: 'JWT update trigger', userId: token.sub, correlationId });

  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (dbUser) {
    const authUserInternal: AuthUserInternal = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      role: dbUser.role as UserRole,
    };
    const updatedToken = buildNewJwt(token, authUserInternal);
    logger.info({
      msg: 'Token updated from DB on update trigger',
      userId: updatedToken.sub,
      role: updatedToken.role,
      correlationId,
    });
    return updatedToken;
  } else {
    logger.warn({
      msg: 'User not found in DB during token update',
      userId: token.sub,
      correlationId,
    });
    return token;
  }
}
