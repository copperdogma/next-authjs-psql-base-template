import { getServerSession as nextAuthGetServerSession } from 'next-auth';
import { AuthOptions } from 'next-auth';
import { authConfig } from '../auth';
import * as pino from 'pino';
import { logger as rootLogger } from '../logger';

const serviceLogger = rootLogger.child({ service: 'session' });

/**
 * Implementation of SessionService using Next Auth
 */
export class SessionService {
  private readonly logger: pino.Logger;

  constructor(
    private readonly authOptions: AuthOptions = authConfig,
    logger: pino.Logger = serviceLogger
  ) {
    this.logger = logger;
    this.logger.debug('SessionService initialized');
  }

  /**
   * Gets the current user session using Next Auth
   */
  async getServerSession(options?: AuthOptions) {
    this.logger.trace('Getting server session');
    try {
      const session = await nextAuthGetServerSession(options || this.authOptions);
      this.logger.debug({ hasSession: !!session }, 'Server session retrieved');
      return session;
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Error getting server session'
      );
      throw error;
    }
  }
}

// Create default instance, update class name
export const defaultSessionService = new SessionService();
