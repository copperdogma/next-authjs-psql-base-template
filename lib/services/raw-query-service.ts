import { PrismaClient, Prisma } from '@prisma/client';
import pino from 'pino';
import { logger as rootLogger } from '../logger';
import { prisma } from '../prisma';

/**
 * Implementation of RawQueryService with dependency injection
 * Provides optimized raw SQL queries for complex operations
 *
 * This service is designed for scenarios where raw SQL offers significant advantages:
 * - Complex aggregations and analytics queries
 * - Bulk updates with database-specific syntax
 * - Performance-critical operations where ORM overhead is significant
 * - Operations using database features not fully supported by Prisma
 *
 * As a best practice, prefer Prisma's type-safe query builder for standard CRUD
 * operations, and reserve raw queries for cases where they provide clear benefits
 * in terms of functionality, performance, or code simplicity.
 */
export class RawQueryServiceImpl {
  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly logger: pino.Logger = rootLogger.child({ component: 'db:raw-queries' })
  ) {}

  /**
   * Build a WHERE clause for date range and user filters
   * @private
   */
  private buildDateUserWhereClause(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): { whereClause: string; params: any[] } {
    const { startDate, endDate, userId } = options;
    const params: any[] = [];
    let whereClause = '';

    // Add date range filters if provided
    if (startDate) {
      params.push(startDate);
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}"createdAt" >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}"createdAt" <= $${params.length}`;
    }

    // Add user filter if provided
    if (userId) {
      params.push(userId);
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}"userId" = $${params.length}`;
    }

    return { whereClause, params };
  }

  /**
   * Handles errors from database operations with standardized logging
   * @private
   */
  private handleQueryError(error: unknown, operation: string, context: object = {}): never {
    this.logger.error({
      msg: `Error during ${operation}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...context,
    });
    throw error;
  }

  /**
   * Performs a complex aggregation using raw SQL
   * Example: Get user session counts grouped by day for analytics
   *
   * Raw SQL is used here for direct control over PostgreSQL's `DATE_TRUNC`
   * and `COUNT(*)` aggregation, which is more performant and precise than
   * trying to replicate this date-based grouping through the ORM.
   * PostgreSQL's date functions allow for optimized database-level calculations
   * that would otherwise require fetching all records and processing in code.
   *
   * @param options Query options
   * @returns Array of daily session counts
   */
  async getUserSessionCountsByDay(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ date: string; count: number }[]> {
    this.logger.debug({
      msg: 'Getting user session counts by day',
      options,
    });

    const { whereClause, params } = this.buildDateUserWhereClause(options);

    try {
      // Execute the raw query with params properly passed
      const results = await this.prismaClient.$queryRaw<{ date: string; count: string }[]>(
        Prisma.sql`
          SELECT 
            DATE_TRUNC('day', "createdAt") AS date,
            COUNT(*) AS count
          FROM "Session"
          ${whereClause ? Prisma.raw(whereClause) : Prisma.empty}
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY date DESC
        `,
        ...params
      );

      // Transform the results (convert count to number)
      const transformedResults = results.map(row => ({
        date: row.date.toString(),
        count: parseInt(row.count, 10),
      }));

      this.logger.debug({
        msg: 'Retrieved session counts',
        count: transformedResults.length,
      });

      return transformedResults;
    } catch (error) {
      return this.handleQueryError(error, 'getting user session counts', { whereClause, params });
    }
  }

  /**
   * Performs a batch update with complex conditions
   * Example: Update all expired sessions for specific users
   *
   * Raw SQL is used here to leverage PostgreSQL-specific interval arithmetic
   * (`interval '${extensionHours} hours'`) which enables a single efficient
   * bulk update operation. This avoids having to fetch all matching sessions,
   * calculate new expiry times in application code, and update them individually,
   * which would be significantly slower for batch operations.
   *
   * @param options Session extension options
   * @returns Number of updated records
   */
  async extendSessionExpirations(options: {
    userIds: string[];
    extensionHours?: number;
    currentExpiryBefore?: Date;
  }): Promise<number> {
    const { userIds, extensionHours = 24, currentExpiryBefore } = options;

    this.logger.debug({
      msg: 'Extending session expirations',
      userCount: userIds.length,
      extensionHours,
    });

    if (!userIds.length) {
      this.logger.info({
        msg: 'No userIds provided, skipping extension operation',
      });
      return 0;
    }

    const { whereClause, params } = this.buildSessionExpirationWhereClause(
      userIds,
      currentExpiryBefore
    );

    try {
      // Execute the update with proper parameterization
      const result = await this.prismaClient.$executeRaw(
        Prisma.sql`
          UPDATE "Session"
          SET 
            "expiresAt" = "expiresAt" + (${Prisma.sql`${extensionHours}`} * interval '1 hour'),
            "updatedAt" = NOW()
          ${Prisma.raw(whereClause)}
        `,
        ...params
      );

      this.logger.info({
        msg: 'Successfully extended session expirations',
        recordsUpdated: result,
      });

      return result;
    } catch (error) {
      return this.handleQueryError(error, 'extending session expirations', { whereClause, params });
    }
  }

  /**
   * Builds the WHERE clause for session expiration with proper parameterization
   * @private
   */
  private buildSessionExpirationWhereClause(
    userIds: string[],
    currentExpiryBefore?: Date
  ): { whereClause: string; params: any[] } {
    const params: any[] = [];

    // Add user IDs to params and build placeholder string
    let whereClause = 'WHERE "userId" = ANY($1::text[])';
    params.push(userIds);

    // Add expiry date if provided
    if (currentExpiryBefore) {
      params.push(currentExpiryBefore);
      whereClause += ` AND "expiresAt" <= $${params.length}`;
    }

    return { whereClause, params };
  }

  /**
   * Performs complex joins and aggregations that would be inefficient with Prisma
   * Example: Get active users with their session counts and latest activity
   *
   * Raw SQL is used here because this query combines multiple operations (joins,
   * aggregations, filtering with HAVING, and ordering) that would require multiple
   * round trips or inefficient in-memory processing with the ORM. Using a single
   * optimized SQL query pushes the complex data processing to the database where
   * indexes and query optimization can dramatically improve performance for
   * analytics-style queries with large datasets.
   *
   * @param options Query options
   * @returns Array of user activity summaries
   */
  async getUserActivitySummary(options: {
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
    const { minSessionCount = 1, since, limit = 50 } = options;

    this.logger.debug({
      msg: 'Getting user activity summary',
      minSessionCount,
      since: since?.toISOString(),
      limit,
    });

    // Build the WHERE clause for date filtering
    const { whereClause, params } = this.buildActivityWhereClause(since);

    try {
      const results = await this.executeActivitySummaryQuery(
        whereClause,
        minSessionCount,
        limit,
        params
      );

      this.logger.debug({
        msg: 'Retrieved user activity summary',
        count: results.length,
      });

      return results;
    } catch (error) {
      return this.handleQueryError(error, 'getting user activity summary', { whereClause, params });
    }
  }

  /**
   * Builds WHERE clause for activity filtering with parameterization
   * @private
   */
  private buildActivityWhereClause(since?: Date): { whereClause: string; params: any[] } {
    const params: any[] = [];

    if (since) {
      params.push(since);
      return {
        whereClause: `WHERE s."createdAt" >= $1`,
        params,
      };
    }

    return {
      whereClause: '',
      params,
    };
  }

  /**
   * Executes activity summary query and transforms results
   * @private
   */
  private async executeActivitySummaryQuery(
    whereClause: string,
    minSessionCount: number,
    limit: number,
    whereParams: any[] = []
  ): Promise<
    Array<{
      userId: string;
      email: string;
      userName: string | null;
      sessionCount: number;
      lastActive: string;
    }>
  > {
    // Build parameters array with whereParams, minSessionCount, and limit
    const allParams = [...whereParams, minSessionCount, limit];

    // Get the correct parameter index for HAVING and LIMIT clauses
    const minSessionCountParamIndex = whereParams.length + 1;
    const limitParamIndex = whereParams.length + 2;

    // Update the whereClause to use the correct parameter indexes if it exists
    const parameterizedWhereClause = whereClause ? whereClause : '';

    // Execute the raw query with proper parameterization using Prisma.sql
    const results = await this.prismaClient.$queryRaw<
      Array<{
        userId: string;
        email: string;
        userName: string | null;
        sessionCount: string;
        lastActive: string;
      }>
    >(
      Prisma.sql`
        SELECT 
          u."id" AS "userId",
          u."email",
          u."name" AS "userName",
          COUNT(s."id") AS "sessionCount",
          MAX(s."createdAt") AS "lastActive"
        FROM "User" u
        LEFT JOIN "Session" s ON u."id" = s."userId"
        ${Prisma.raw(parameterizedWhereClause)}
        GROUP BY u."id", u."email", u."name"
        HAVING COUNT(s."id") >= $${minSessionCountParamIndex}
        ORDER BY MAX(s."createdAt") DESC
        LIMIT $${limitParamIndex}
      `,
      ...allParams
    );

    // Transform the results
    return results.map(row => ({
      userId: row.userId,
      email: row.email,
      userName: row.userName,
      sessionCount: parseInt(row.sessionCount, 10),
      lastActive: row.lastActive.toString(),
    }));
  }

  /**
   * Executes a safe parametrized raw query
   * This is a utility method for custom raw queries with proper parameter handling
   *
   * This method should be used when:
   * 1. The operation is too complex for Prisma's query builder (e.g., requires window functions,
   *    complex CTEs, or specific PostgreSQL functions)
   * 2. Performance is critical and the ORM approach would be inefficient
   * 3. You need database-specific features not exposed by the ORM
   *
   * Always use parameterized queries with this method to prevent SQL injection.
   * Consider documenting complex queries with explanatory comments.
   *
   * @param sql SQL query with $1, $2, etc. placeholders
   * @param params Parameters to bind to the query
   * @returns Query results
   */
  async executeRawQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
    this.logger.trace({ msg: 'Executing raw query', sql, params });
    try {
      // Convert the SQL string and parameters to a tagged template literal that Prisma requires
      const result = (await this.prismaClient.$queryRaw(Prisma.raw(sql), ...params)) as T;

      this.logger.debug({
        msg: 'Raw query executed successfully',
      });

      return result;
    } catch (error) {
      return this.handleQueryError(error, 'executing raw query', { sql });
    }
  }
}

// Create a default instance for easy importing
export const defaultRawQueryService = new RawQueryServiceImpl();
