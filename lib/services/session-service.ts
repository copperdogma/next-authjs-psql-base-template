import { SessionService } from '../interfaces/services';
import { getServerSession as nextAuthGetServerSession } from 'next-auth';
import { AuthOptions } from 'next-auth';
import { authConfig } from '../auth';

/**
 * Implementation of SessionService using Next Auth
 */
export class NextAuthSessionService implements SessionService {
  constructor(private readonly authOptions: AuthOptions = authConfig) {}

  /**
   * Gets the current user session using Next Auth
   */
  async getServerSession(options?: AuthOptions) {
    return nextAuthGetServerSession(options || this.authOptions);
  }
}

// Create default instance
export const defaultSessionService = new NextAuthSessionService();
