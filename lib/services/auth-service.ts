import { NextAuthOptions, Session, User, Account } from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../prisma';
import { JWT } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../interfaces/services';
import { createContextLogger } from './logger-service';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types';

// Define the interface needed for options
interface ClientInfoOptions {
  callbackUrl?: string;
}

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
  public extractClientInfo(
    options: ClientInfoOptions | undefined,
    isServerSide: boolean
  ): Record<string, string> {
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
  public logSignInSuccess(params: {
    userId: string;
    provider: string;
    email?: string;
    name?: string;
  }): void {
    this.logger.info({
      msg: 'Sign-in attempt completed',
      userId: params.userId,
      provider: params.provider,
      email: params.email,
      name: params.name,
    });
  }

  /**
   * Log a failed sign-in attempt
   */
  public logSignInFailure(params: { provider: string; error: string; email?: string }): void {
    this.logger.warn({
      msg: 'Sign-in attempt failed',
      provider: params.provider,
      error: params.error,
      email: params.email,
    });
  }

  /**
   * Log an error during sign-in
   */
  public logSignInError(params: { provider: string; error: unknown }): void {
    this.logger.error({
      msg: 'Sign-in attempt threw exception',
      provider: params.provider,
      error:
        params.error instanceof Error
          ? {
              message: params.error.message,
              stack: params.error.stack,
            }
          : String(params.error),
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
    return {
      session: async ({ session, token }: { session: Session; token: JWT }) => {
        if (token.sub) {
          if (!session.user) {
            session.user = { id: token.sub, role: token.role || UserRole.USER };
          } else {
            session.user.id = token.sub;
            session.user.role = token.role || UserRole.USER;
          }
          session.user.name = token.name ?? null;
          session.user.email = token.email ?? null;
          session.user.image = token.picture ?? null;

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

      jwt: async ({ token, user, trigger }: { token: JWT; user: User; trigger?: string }) => {
        if (user) {
          return this.updateTokenWithUserData(token, user);
        }
        if (trigger === 'update' && token.sub) {
          return this.refreshTokenFromDatabase(token);
        }
        return token;
      },
    };
  }

  /**
   * Creates the event handlers for NextAuth
   */
  private createEventHandlers() {
    return {
      signIn: ({ user }: { user: User }) => {
        this.logger.info({
          msg: 'User authenticated successfully',
          userId: user.id,
          email: user.email,
        });
      },
      signOut: ({ token }: { token: JWT }) => {
        this.logger.info({
          msg: 'User signed out',
          userId: token?.sub,
        });
      },
      createUser: ({ user }: { user: User }) => {
        this.logger.info({
          msg: 'New user created',
          userId: user.id,
          email: user.email,
        });
      },
      linkAccount: ({ user, account }: { user: User; account: Account }) => {
        this.logger.info({
          msg: 'Account linked to user',
          userId: user.id,
          provider: account.provider,
        });
      },
      session: ({ token }: { token: JWT }) => {
        this.logger.debug({
          msg: 'Session updated',
          userId: token.sub,
        });
      },
    };
  }

  /**
   * Creates the NextAuth configuration
   * @returns NextAuthOptions configuration
   */
  public createAuthConfig(): NextAuthOptions {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: Resolve Adapter type conflict - Cast needed due to mismatch between augmented NextAuth types and PrismaAdapter expectations.
      adapter: PrismaAdapter(this.prismaClient) as any,
      providers: this.createProviders(),
      callbacks: this.createCallbacks(),
      events: this.createEventHandlers(),
      pages: {
        signIn: '/login',
      },
      session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
      ...(!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('${')
        ? { url: getBaseUrl() }
        : {}),
      secret: process.env.NEXTAUTH_SECRET,
      debug: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Updates a JWT token with user data from sign-in
   */
  private async updateTokenWithUserData(token: JWT, user: User): Promise<JWT> {
    token.sub = user.id;
    token.email = user.email ?? undefined;
    token.name = user.name ?? undefined;
    token.picture = user.image ?? undefined;

    const dbUser = await this.prismaClient.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    token.role = (dbUser?.role as UserRole | undefined) ?? UserRole.USER;
    this.logger.debug({ msg: 'JWT updated with user data', userId: user.id, role: token.role });
    return token;
  }

  /**
   * Gets user data from database for token refresh
   */
  private async refreshTokenFromDatabase(token: JWT): Promise<JWT> {
    if (!token.sub) {
      this.logger.error('Cannot refresh token without user ID (sub)');
      return token;
    }

    const dbUser = await this.prismaClient.user.findUnique({
      where: { id: token.sub },
      select: { name: true, email: true, image: true, role: true },
    });

    if (!dbUser) {
      this.logger.error({ msg: 'Cannot refresh token: User not found in DB', userId: token.sub });
      return { ...token, error: 'UserNotFound' };
    }

    token.name = dbUser.name ?? undefined;
    token.email = dbUser.email ?? undefined;
    token.picture = dbUser.image ?? undefined;
    token.role = (dbUser.role as UserRole | undefined) ?? UserRole.USER;

    this.logger.debug({ msg: 'JWT refreshed from database', userId: token.sub });
    return token;
  }
}
