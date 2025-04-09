import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import { default as NextAuth } from 'next-auth';
import { loggers } from './logger';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

const logger = loggers.auth;

/**
 * Helper function to dynamically determine the base URL
 * This handles cases where the port might change between environments
 */
function getBaseUrl(): string {
  // In the browser, use window.location
  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }

  // In server context, use environment variables with fallbacks
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
  return `http://localhost:${port}`;
}

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // Only use custom pages when there are multiple providers or for specific scenarios
  // We'll remove this for now to avoid the unnecessary redirect
  // pages: {
  //   signIn: '/login',
  // },
  callbacks: {
    // Add user ID to the session
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        logger.debug({
          msg: 'Session callback executed',
          userId: token.sub,
          email: session.user.email,
        });
      }
      return session;
    },
    // Persist the user ID onto the token right after signin
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        logger.info({
          msg: 'User signed in',
          userId: user.id,
        });
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // If NEXTAUTH_URL is not explicitly set or it contains an environment variable placeholder,
  // use our dynamic detection
  ...(!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('${')
    ? { url: getBaseUrl() }
    : {}),
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    signIn: ({ user }) => {
      logger.info({
        msg: 'User authenticated successfully',
        userId: user.id,
        email: user.email,
      });
    },
    signOut: ({ token }) => {
      logger.info({
        msg: 'User signed out',
        userId: token?.sub,
      });
    },
    createUser: ({ user }) => {
      logger.info({
        msg: 'New user created',
        userId: user.id,
        email: user.email,
      });
    },
    linkAccount: ({ user, account }) => {
      logger.info({
        msg: 'Account linked to user',
        userId: user.id,
        provider: account.provider,
      });
    },
    session: ({ token }) => {
      // Sessions are frequently updated so use debug level
      if (token?.sub) {
        logger.debug({
          msg: 'Session updated',
          userId: token.sub,
        });
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Type definitions for logging parameters
 */
export interface SignInLoggingParams {
  logger: any;
  provider: string | undefined;
  correlationId: string;
  startTime: number;
}

export interface SignInFailureParams extends SignInLoggingParams {
  error: string;
}

export interface SignInErrorParams extends SignInLoggingParams {
  error: unknown;
}

/**
 * Extracts client information from sign-in options
 */
export function extractClientInfo(options: any, isServerSide: boolean): Record<string, string> {
  return {
    source:
      typeof options === 'object' && 'callbackUrl' in options
        ? (options.callbackUrl as string)
        : 'unknown',
    userAgent: !isServerSide ? window.navigator.userAgent : 'server',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a correlation ID for tracking auth attempts
 */
export function createCorrelationId(prefix: string = 'auth'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Logs successful sign-in completion
 */
export function logSignInSuccess(params: SignInLoggingParams): void {
  const { logger, provider, correlationId, startTime } = params;

  logger.info({
    msg: 'Sign-in attempt completed',
    provider,
    success: true,
    correlationId,
    duration: Date.now() - startTime,
  });
}

/**
 * Logs sign-in failure from result
 */
export function logSignInFailure(params: SignInFailureParams): void {
  const { logger, provider, error, correlationId, startTime } = params;

  logger.warn({
    msg: 'Sign-in attempt failed',
    provider,
    error,
    correlationId,
    duration: Date.now() - startTime,
  });
}

/**
 * Logs unexpected sign-in error
 */
export function logSignInError(params: SignInErrorParams): void {
  const { logger, provider, error, correlationId, startTime } = params;

  logger.error({
    msg: 'Sign-in attempt threw exception',
    provider,
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    correlationId,
    duration: Date.now() - startTime,
  });
}

/**
 * Enhanced signIn function with comprehensive logging and error handling
 */
export const signInWithLogging = async (...args: Parameters<typeof signIn>) => {
  const startTime = Date.now();
  const provider = args[0] as string | undefined;
  const options = args[1] || {};
  const isServerSide = typeof window === 'undefined';

  // Extract client info
  const clientInfo = extractClientInfo(options, isServerSide);

  // Create a correlation ID for this authentication attempt
  const correlationId = createCorrelationId();

  logger.info({
    msg: 'Sign-in attempt initiated',
    provider,
    clientInfo,
    correlationId,
  });

  try {
    const result = await signIn(...args);

    // Log based on result
    if (result?.error) {
      logSignInFailure({
        logger,
        provider,
        error: result.error,
        correlationId,
        startTime,
      });
    } else {
      logSignInSuccess({
        logger,
        provider,
        correlationId,
        startTime,
      });
    }

    return result;
  } catch (error) {
    // Log unexpected errors
    logSignInError({
      logger,
      provider,
      error,
      correlationId,
      startTime,
    });

    // Re-throw to allow caller to handle
    throw error;
  }
};

/**
 * Enhanced signOut function with comprehensive logging and error handling
 *
 * This function extends the NextAuth signOut with:
 * 1. Pre-signout logging
 * 2. Error capture and logging
 * 3. Client context tracking
 * 4. Performance timing
 *
 * @param args - Standard signOut parameters
 * @returns The result from NextAuth signOut
 */
export const signOutWithLogging = async (...args: Parameters<typeof signOut>) => {
  const startTime = Date.now();
  const options = args[0] || {};

  // Extract client info
  const clientInfo = {
    callbackUrl:
      typeof options === 'object' && 'callbackUrl' in options
        ? (options.callbackUrl as string)
        : 'default',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    timestamp: new Date().toISOString(),
  };

  // Create a correlation ID for this signout attempt
  const correlationId = `signout_${Math.random().toString(36).substring(2, 10)}`;

  logger.info({
    msg: 'Sign-out initiated',
    clientInfo,
    correlationId,
  });

  try {
    const result = await signOut(...args);

    logger.info({
      msg: 'Sign-out completed',
      success: true,
      correlationId,
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // Log unexpected errors during sign-out
    logger.error({
      msg: 'Sign-out attempt threw exception',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      correlationId,
      duration: Date.now() - startTime,
    });

    // Re-throw to allow caller to handle
    throw error;
  }
};
