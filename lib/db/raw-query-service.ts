// =============================================================================
// DEPRECATED: This file is deprecated and will be removed in a future version.
// It is a facade for RawQueryServiceImpl from lib/services/raw-query-service.ts.
// Please use RawQueryServiceImpl directly or through the getRawQueryService()
// function from lib/server/services.ts.
// =============================================================================

import { defaultRawQueryService } from '../services/raw-query-service';

/**
 * Service for executing optimized raw SQL queries for complex operations
 * that would be inefficient with standard Prisma query methods.
 *
 * This is a facade for the RawQueryServiceImpl that maintains backward compatibility.
 * New code should use the implementation from lib/services/raw-query-service.ts directly.
 *
 * @deprecated Use the RawQueryServiceImpl from lib/services/raw-query-service instead
 */
export class RawQueryService {
  /**
   * Performs a complex aggregation using raw SQL
   * Example: Get user session counts grouped by day for analytics
   *
   * @param options Query options
   * @returns Array of daily session counts
   * @deprecated Use RawQueryServiceImpl.getUserSessionCountsByDay from lib/services/raw-query-service.ts instead
   */
  static async getUserSessionCountsByDay(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ date: string; count: number }[]> {
    return defaultRawQueryService.getUserSessionCountsByDay(options);
  }

  /**
   * Performs a batch update with complex conditions
   * Example: Update all expired sessions for specific users
   *
   * @param options Options for session extension
   * @returns Number of updated records
   * @deprecated Use RawQueryServiceImpl.extendSessionExpirations from lib/services/raw-query-service.ts instead
   */
  static async extendSessionExpirations(options: {
    userIds: string[];
    extensionHours?: number;
    currentExpiryBefore?: Date;
  }): Promise<number> {
    // Forward the call to the service implementation
    return defaultRawQueryService.extendSessionExpirations(options);
  }

  /**
   * Performs complex joins and aggregations that would be inefficient with Prisma
   * Example: Get active users with their session counts and latest activity
   *
   * @param options Query options
   * @returns Array of user activity summaries
   * @deprecated Use RawQueryServiceImpl.getUserActivitySummary from lib/services/raw-query-service.ts instead
   */
  static async getUserActivitySummary(options: {
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
  > {
    return defaultRawQueryService.getUserActivitySummary(options);
  }

  /**
   * Executes a safe parametrized raw query
   * This is a utility method for custom raw queries with proper parameter handling
   *
   * @param sql SQL query with $1, $2, etc. placeholders
   * @param params Parameters to bind to the query
   * @returns Query results
   * @deprecated Use RawQueryServiceImpl.executeRawQuery from lib/services/raw-query-service.ts instead
   */
  static async executeRawQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
    return defaultRawQueryService.executeRawQuery<T>(sql, params);
  }
}
