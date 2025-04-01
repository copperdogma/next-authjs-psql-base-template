import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';
import { loggers } from './logger';

const logger = loggers.auth;

export const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
 * Enhanced signIn function with comprehensive logging and error handling
 *
 * This function extends the NextAuth signIn with:
 * 1. Pre-auth attempt logging
 * 2. Error capture and logging
 * 3. Client context tracking
 * 4. Performance timing
 *
 * @param args - Standard signIn parameters
 * @returns The result from NextAuth signIn
 */
export const signInWithLogging = async (...args: Parameters<typeof signIn>) => {
  const startTime = Date.now();
  const provider = args[0];
  const options = args[1] || {};

  // Extract client info (can be passed by components)
  const clientInfo = {
    source:
      typeof options === 'object' && 'callbackUrl' in options
        ? (options.callbackUrl as string)
        : 'unknown',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    timestamp: new Date().toISOString(),
  };

  // Create a correlation ID for this authentication attempt
  const correlationId = `auth_${Math.random().toString(36).substring(2, 10)}`;

  logger.info({
    msg: 'Sign-in attempt initiated',
    provider,
    clientInfo,
    correlationId,
  });

  try {
    const result = await signIn(...args);

    // Log success/error based on result
    if (result?.error) {
      logger.warn({
        msg: 'Sign-in attempt failed',
        provider,
        error: result.error,
        correlationId,
        duration: Date.now() - startTime,
      });
    } else {
      logger.info({
        msg: 'Sign-in attempt completed',
        provider,
        success: true,
        correlationId,
        duration: Date.now() - startTime,
      });
    }

    return result;
  } catch (error) {
    // Log unexpected errors during sign-in
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
