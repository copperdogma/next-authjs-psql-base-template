import { LoggerService } from '@/lib/interfaces/services';

/**
 * Service for diagnostic logging
 */
export function createDiagnosticService(logger: LoggerService) {
  /**
   * Logs the environment state for debugging
   */
  function logEnvironmentState(): void {
    logger.info({
      envVars: {
        AUTH_EMULATOR_HOST: process.env.AUTH_EMULATOR_HOST || 'not set',
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || 'not set',
        USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR || 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SECRET SET]' : 'not set',
        TEST_EMAIL: process.env.TEST_USER_EMAIL ? '[EMAIL SET]' : 'not set',
        TEST_PASSWORD: process.env.TEST_USER_PASSWORD ? '[PASSWORD SET]' : 'not set',
      },
      msg: 'Auth service environment state',
    });
  }

  return { logEnvironmentState };
}
