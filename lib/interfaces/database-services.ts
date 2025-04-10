/**
 * Interface definitions for database-related services
 */

export interface RawQueryService {
  /**
   * Performs a complex aggregation using raw SQL
   * Example: Get user session counts grouped by day for analytics
   *
   * @param options Query options
   * @returns Array of daily session counts
   */
  getUserSessionCountsByDay(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ date: string; count: number }[]>;

  /**
   * Performs a batch update with complex conditions
   * Example: Update all expired sessions for specific users
   *
   * @param options Update options
   * @returns Number of updated records
   */
  extendSessionExpirations(options: {
    userIds: string[];
    extensionHours: number;
    currentExpiryBefore?: Date;
  }): Promise<number>;

  /**
   * Performs complex joins and aggregations that would be inefficient with Prisma
   * Example: Get active users with their session counts and latest activity
   *
   * @param options Query options
   * @returns Array of user activity summaries
   */
  getUserActivitySummary(options: {
    minSessionCount?: number;
    since?: Date;
    limit?: number;
  }): Promise<
    Array<{
      userId: string;
      email: string;
      userName: string | null;
      sessionCount: number;
      lastActive: string;
    }>
  >;

  /**
   * Executes a safe parametrized raw query
   * This is a utility method for custom raw queries with proper parameter handling
   *
   * @param sql SQL query with $1, $2, etc. placeholders
   * @param params Parameters to bind to the query
   * @returns Query results
   */
  executeRawQuery<T = any>(sql: string, params: any[]): Promise<T>;
}

export interface PrismaClientService {
  /**
   * Executes a raw query with tagged template syntax
   */
  $queryRaw: any;

  /**
   * Executes a raw SQL command that doesn't return data
   */
  $executeRaw: any;
}
