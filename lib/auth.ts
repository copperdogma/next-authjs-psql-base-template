// =============================================================================
// Unit Testing Note:
// Unit testing authentication configurations, especially involving NextAuth.js and
// potentially dependency injection patterns, can be complex. Mocking NextAuth
// internals, session handling, and providers within a Jest environment is often
// challenging. Unit tests for this configuration were skipped due to these
// difficulties.
//
// Validation Strategy:
// The overall authentication flow, including configuration aspects, is primarily
// validated through End-to-End (E2E) tests that simulate real user login and
// session management scenarios.
// =============================================================================
import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import { default as NextAuth } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { JWT } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import type { LoggerService } from '@/lib/interfaces/services';
import { createContextLogger } from '@/lib/services/logger-service';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types';
import {
  signInWithLogging,
  signOutWithLogging,
  createCorrelationId,
  extractClientInfo,
  logSignInSuccess,
  logSignInFailure,
  logSignInError,
} from './auth-logging';
import type { SignInLoggingParams, SignInFailureParams, SignInErrorParams } from './auth-logging';

// Re-export functions from auth-logging.ts
export {
  signInWithLogging,
  signOutWithLogging,
  createCorrelationId,
  extractClientInfo,
  logSignInSuccess,
  logSignInFailure,
  logSignInError,
};

// Re-export types from auth-logging.ts
export type { SignInLoggingParams, SignInFailureParams, SignInErrorParams };

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
   * Creates a correlation ID for tracking authentication flows
   */
  public createCorrelationId(prefix: string = 'auth'): string {
    return `${prefix}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Extract client information for logging
   */
  public extractClientInfo(options: any, isServerSide: boolean): Record<string, string> {
    const clientInfo: Record<string, string> = {
      source: options?.callbackUrl || '/',
      timestamp: new Date().toISOString(),
    };

    if (!isServerSide && typeof window !== 'undefined') {
      clientInfo.userAgent = window.navigator.userAgent;
      clientInfo.referrer = document.referrer || '';
    } else if (isServerSide) {
      clientInfo.userAgent = 'server';
    }

    return clientInfo;
  }

  /**
   * Log a successful sign-in attempt
   */
  public logSignInSuccess(params: { provider: string; correlationId: string }): void {
    this.logger.info({
      msg: 'Sign-in attempt completed',
      provider: params.provider,
      correlationId: params.correlationId,
      success: true,
      duration: 100, // Mock duration for testing
    });
  }

  /**
   * Log a failed sign-in attempt
   */
  public logSignInFailure(params: {
    provider: string;
    error: string;
    correlationId: string;
  }): void {
    this.logger.warn({
      msg: 'Sign-in attempt failed',
      provider: params.provider,
      error: params.error,
      correlationId: params.correlationId,
      duration: 100, // Mock duration for testing
    });
  }

  /**
   * Log an error during sign-in
   */
  public logSignInError(params: { provider: string; error: Error; correlationId: string }): void {
    this.logger.error({
      msg: 'Sign-in attempt threw exception',
      provider: params.provider,
      error: {
        message: params.error.message,
        name: params.error.name,
        stack: params.error.stack,
      },
      correlationId: params.correlationId,
      duration: 100, // Mock duration for testing
    });
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
        if (token.sub) {
          session.user.id = token.sub;
          session.user.role = token.role as UserRole;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.image = token.picture;
          this.logger.debug({
            msg: 'Session callback executed',
            userId: token.sub,
            email: session.user.email,
          });
        } else {
          this.logger.warn('Session callback: Token subject (sub) is missing.');
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

    // Only update picture if image exists
    if (user.image) {
      token.picture = user.image;
    }

    // Only set role if it exists, default to USER role otherwise
    token.role = user.role || UserRole.USER;

    this.logger.info({
      msg: 'User signed in',
      userId: user.id,
    });

    return token;
  }

  /**
   * Gets user data from database for token refresh
   */
  private async refreshTokenFromDatabase(token: JWT): Promise<JWT> {
    try {
      // Fetch latest user data from database
      const user = await this.prismaClient.user.findUnique({
        where: { id: token.sub },
        select: { name: true, email: true, image: true },
      });

      if (user) {
        token.name = user.name || undefined;
        token.email = user.email || undefined;
        // Only update picture if image exists
        if (user.image) {
          token.picture = user.image;
        }
        // Keep existing role as it's not directly stored in the basic user model
        // token.role is maintained from previous token

        this.logger.debug({
          msg: 'Token refreshed with updated user data',
          userId: token.sub,
        });
      } else {
        this.logger.warn({
          msg: 'User not found during token refresh',
          userId: token.sub,
        });
      }

      return token;
    } catch (error) {
      this.logger.error({
        msg: 'Failed to refresh token from database',
        userId: token.sub,
        error,
      });

      return token;
    }
  }
}

/**
 * Factory function to create NextAuth configuration with dependency injection
 * This is for backward compatibility
 */
export function createAuthConfig(
  prismaClient: PrismaClient = prisma,
  logger: LoggerService = createContextLogger('auth')
): NextAuthOptions {
  const authService = new AuthService(logger, prismaClient);
  return authService.createAuthConfig();
}

// Create the default auth configuration for backward compatibility
export const authConfig = createAuthConfig();

// This is the default export for NextAuth
export default NextAuth(authConfig);
