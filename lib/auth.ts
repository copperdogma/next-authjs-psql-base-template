import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import { default as NextAuth } from 'next-auth';
import { loggers } from './logger';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { JWT } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from './interfaces/services';
import { createContextLogger } from './services/logger-service';

// Default logger for backward compatibility
const defaultLogger = loggers.auth;

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

/**
 * Auth service class with dependency injection support
 */
export class AuthService {
  private logger: LoggerService;
  private prismaClient: PrismaClient;

  /**
   * Creates a new AuthService instance
   *
   * @param logger - Logger service to use
   * @param prismaClient - PrismaClient instance to use
   */
  constructor(
    logger: LoggerService = createContextLogger('auth'),
    prismaClient: PrismaClient = prisma
  ) {
    this.logger = logger;
    this.prismaClient = prismaClient;
  }

  /**
   * Creates the provider configurations
   */
  private createProviders() {
    return [
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
    ];
  }

  /**
   * Creates the callback functions for NextAuth
   */
  private createCallbacks() {
    // Use arrow functions to preserve 'this' context
    return {
      // Add user ID to the session
      session: async ({ session, token }: { session: any; token: any }) => {
        if (token.sub && session.user) {
          session.user.id = token.sub;

          // Use token data for name and email if available
          if (token.name) session.user.name = token.name;
          if (token.email) session.user.email = token.email;

          this.logger.debug({
            msg: 'Session callback executed',
            userId: token.sub,
            email: session.user.email,
          });
        }
        return session;
      },

      // JWT callback - runs when a JWT is created or updated
      jwt: async ({ token, user, trigger }: { token: any; user: any; trigger?: string }) => {
        // Case 1: User object provided (sign-in)
        if (user) {
          return this.updateTokenWithUserData(token, user);
        }

        // Case 2: Update trigger with valid subject
        if (trigger === 'update' && token.sub) {
          return this.refreshTokenFromDatabase(token);
        }

        // Case 3: Default case - return token unchanged
        return token;
      },
    };
  }

  /**
   * Creates the event handlers for NextAuth
   */
  private createEventHandlers() {
    return {
      signIn: ({ user }: { user: any }) => {
        this.logger.info({
          msg: 'User authenticated successfully',
          userId: user.id,
          email: user.email,
        });
      },
      signOut: ({ token }: { token: any }) => {
        this.logger.info({
          msg: 'User signed out',
          userId: token?.sub,
        });
      },
      createUser: ({ user }: { user: any }) => {
        this.logger.info({
          msg: 'New user created',
          userId: user.id,
          email: user.email,
        });
      },
      linkAccount: ({ user, account }: { user: any; account: any }) => {
        this.logger.info({
          msg: 'Account linked to user',
          userId: user.id,
          provider: account.provider,
        });
      },
      session: ({ token }: { token: any }) => {
        // Sessions are frequently updated so use debug level
        if (token?.sub) {
          this.logger.debug({
            msg: 'Session updated',
            userId: token.sub,
          });
        }
      },
    };
  }

  /**
   * Creates the NextAuth configuration
   * @returns NextAuthOptions configuration
   */
  public createAuthConfig(): NextAuthOptions {
    return {
      adapter: PrismaAdapter(this.prismaClient),
      providers: this.createProviders(),
      callbacks: this.createCallbacks(),
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
      events: this.createEventHandlers(),
    };
  }

  /**
   * Updates a JWT token with user data from sign-in
   */
  private async updateTokenWithUserData(token: JWT, user: any): Promise<JWT> {
    token.id = user.id;
    token.name = user.name || undefined;
    token.email = user.email || undefined;

    this.logger.info({
      msg: 'User signed in',
      userId: user.id,
    });

    return token;
  }

  /**
   * Gets user data from database for token refresh
   * @param token The JWT token to update
   * @returns Updated JWT token with fresh user data
   */
  private async refreshTokenFromDatabase(token: JWT): Promise<JWT> {
    try {
      // Fetch fresh user data from database
      const user = await this.prismaClient.user.findUnique({
        where: { id: token.sub },
        select: { name: true, email: true },
      });

      if (user) {
        token.name = user.name || undefined;
        token.email = user.email || undefined;
      }

      return token;
    } catch (error) {
      this.logger.error({ msg: 'Failed to refresh token from database', userId: token.sub, error });
      return token; // Return original token on error
    }
  }

  /**
   * Creates a correlation ID for tracking auth attempts
   */
  public createCorrelationId(prefix: string = 'auth'): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Extracts client information from sign-in options
   */
  public extractClientInfo(options: any, isServerSide: boolean): Record<string, string> {
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
   * Logs successful sign-in completion
   */
  public logSignInSuccess(params: SignInLoggingParams): void {
    const { provider, correlationId, startTime } = params;

    this.logger.info({
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
  public logSignInFailure(params: SignInFailureParams): void {
    const { provider, error, correlationId, startTime } = params;

    this.logger.warn({
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
  public logSignInError(params: SignInErrorParams): void {
    const { provider, error, correlationId, startTime } = params;

    this.logger.error({
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
}

// Create default AuthService instance
const defaultAuthService = new AuthService();

// Create the default auth configuration
export const authConfig = defaultAuthService.createAuthConfig();

// Export the NextAuth handlers with the default configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// For backward compatibility with existing code that uses createAuthConfig
/**
 * Creates the NextAuth configuration with dependency injection
 * @param prismaClient PrismaClient instance to use for database operations
 * @param logger Logger service to use
 * @returns NextAuthOptions configuration
 */
export function createAuthConfig(
  prismaClient: PrismaClient = prisma,
  logger: LoggerService = createContextLogger('auth')
): NextAuthOptions {
  const authService = new AuthService(logger, prismaClient);
  return authService.createAuthConfig();
}

/**
 * Type definitions for logging parameters
 */
export interface SignInLoggingParams {
  logger?: LoggerService;
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
 * Enhanced signIn function with comprehensive logging and error handling
 */
export const signInWithLogging = async (...args: Parameters<typeof signIn>) => {
  const startTime = Date.now();
  const provider = args[0] as string | undefined;
  const options = args[1] || {};
  const isServerSide = typeof window === 'undefined';
  const authService = new AuthService();

  // Extract client info
  const clientInfo = authService.extractClientInfo(options, isServerSide);

  // Create a correlation ID for this authentication attempt
  const correlationId = authService.createCorrelationId();

  defaultLogger.info({
    msg: 'Sign-in attempt initiated',
    provider,
    clientInfo,
    correlationId,
  });

  try {
    const result = await signIn(...args);

    // Log based on result
    if (result?.error) {
      authService.logSignInFailure({
        provider,
        error: result.error,
        correlationId,
        startTime,
      });
    } else {
      authService.logSignInSuccess({
        provider,
        correlationId,
        startTime,
      });
    }

    return result;
  } catch (error) {
    // Log unexpected errors
    authService.logSignInError({
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

  defaultLogger.info({
    msg: 'Sign-out initiated',
    clientInfo,
    correlationId,
  });

  try {
    const result = await signOut(...args);

    defaultLogger.info({
      msg: 'Sign-out completed',
      success: true,
      correlationId,
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // Log unexpected errors during sign-out
    defaultLogger.error({
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
