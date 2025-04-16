/**
 * Common service interfaces for application-wide use
 */
// Removed firebase-admin import attempts

/**
 * Interface for logger services, supporting standard log levels and context
 */
export interface LoggerService {
  /**
   * Log at info level
   * @param obj Data object or message string
   * @param msg Optional message if first parameter is an object
   */
  info(obj: object | string, msg?: string): void;

  /**
   * Log at error level
   * @param obj Data object or message string
   * @param msg Optional message if first parameter is an object
   */
  error(obj: object | string, msg?: string): void;

  /**
   * Log at warning level
   * @param obj Data object or message string
   * @param msg Optional message if first parameter is an object
   */
  warn(obj: object | string, msg?: string): void;

  /**
   * Log at debug level
   * @param obj Data object or message string
   * @param msg Optional message if first parameter is an object
   */
  debug(obj: object | string, msg?: string): void;

  /**
   * Create a child logger with additional context
   * @param bindings Context data to add to all log entries from this logger
   */
  child?(bindings: Record<string, unknown>): LoggerService;

  /**
   * Optional context property for logger instances
   */
  context?: Record<string, unknown>;
}

/**
 * Interface for Firebase Admin service operations
 */
export interface FirebaseAdminService {
  /**
   * Verify a Firebase ID token
   * @param token Firebase ID token to verify
   */
  verifyIdToken(token: string): Promise<unknown>;

  /**
   * Get a user by their Firebase UID
   * @param uid Firebase user ID
   */
  getUserByUid(uid: string): Promise<unknown>;

  /**
   * Update a user's profile in Firebase Auth
   * @param uid Firebase user ID
   * @param updates Object containing profile updates
   */
  updateUser(uid: string, updates: Record<string, unknown>): Promise<unknown>;

  /**
   * Creates a custom token for authentication
   * @param uid Firebase user ID to create token for
   * @param claims Optional custom claims to include in the token
   */
  createCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string>;
}

/**
 * Interface for raw database query services
 */
export interface RawQueryService {
  /**
   * Execute a raw SQL query
   * @param sql SQL query string
   * @param params Query parameters
   */
  executeRawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T>;

  /**
   * Extend session expirations for specified users
   * @param options Options for extending sessions
   * @param options.userIds Array of user IDs whose sessions should be extended
   * @param options.extensionHours Number of hours to extend sessions (default: 24)
   * @param options.currentExpiryBefore Only extend sessions expiring before this date
   */
  extendSessionExpirations(options: {
    userIds: string[];
    extensionHours?: number;
    currentExpiryBefore?: Date;
  }): Promise<number>;
}
