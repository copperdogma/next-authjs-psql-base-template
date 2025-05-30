import { PrismaClient, Prisma } from '@prisma/client';
import pino from 'pino';
import { logger as rootLogger } from '../logger';
import { prisma } from '../prisma';

/**
 * Implementation of RawQueryService with dependency injection
 * Provides optimized raw SQL queries for complex operations
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

    const { whereClause } = this.buildDateUserWhereClause(options);

    try {
      // Execute the raw query
      const results = await this.prismaClient.$queryRaw<{ date: string; count: string }[]>`
        SELECT 
          DATE_TRUNC('day', "createdAt") AS date,
          COUNT(*) AS count
        FROM "Session"
        ${Prisma.raw(whereClause)}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date DESC
      `;

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
      return this.handleQueryError(error, 'getting user session counts', { whereClause });
    }
  }

  /**
   * Performs a batch update with complex conditions
   * Example: Update all expired sessions for specific users
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

    const whereClause = this.buildSessionExpirationWhereClause(userIds, currentExpiryBefore);

    try {
      // Execute the update
      const result = await this.prismaClient.$executeRaw`
        UPDATE "Session"
        SET 
          "expiresAt" = "expiresAt" + interval '${extensionHours} hours',
          "updatedAt" = NOW()
        ${Prisma.raw(whereClause)}
      `;

      this.logger.info({
        msg: 'Successfully extended session expirations',
        recordsUpdated: result,
      });

      return result;
    } catch (error) {
      return this.handleQueryError(error, 'extending session expirations', { whereClause });
    }
  }

  /**
   * Builds the WHERE clause for session expiration
   * @private
   */
  private buildSessionExpirationWhereClause(userIds: string[], currentExpiryBefore?: Date): string {
    // Convert userIds array to SQL array
    const userIdsParam = userIds.map(id => `'${id}'`).join(',');
    let whereClause = `WHERE "userId" IN (${userIdsParam})`;

    if (currentExpiryBefore) {
      whereClause += ` AND "expiresAt" <= '${currentExpiryBefore.toISOString()}'`;
    }

    return whereClause;
  }

  /**
   * Performs complex joins and aggregations that would be inefficient with Prisma
   * Example: Get active users with their session counts and latest activity
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
    const whereClause = this.buildActivityWhereClause(since);

    try {
      const results = await this.executeActivitySummaryQuery(whereClause, minSessionCount, limit);

      this.logger.debug({
        msg: 'Retrieved user activity summary',
        count: results.length,
      });

      return results;
    } catch (error) {
      return this.handleQueryError(error, 'getting user activity summary');
    }
  }

  /**
   * Builds WHERE clause for activity filtering
   * @private
   */
  private buildActivityWhereClause(since?: Date): string {
    return since ? `WHERE s."createdAt" >= '${since.toISOString()}'` : '';
  }

  /**
   * Executes activity summary query and transforms results
   * @private
   */
  private async executeActivitySummaryQuery(
    whereClause: string,
    minSessionCount: number,
    limit: number
  ): Promise<
    Array<{
      userId: string;
      email: string;
      userName: string | null;
      sessionCount: number;
      lastActive: string;
    }>
  > {
    // Execute the raw query
    const results = await this.prismaClient.$queryRaw<
      Array<{
        userId: string;
        email: string;
        userName: string | null;
        sessionCount: string;
        lastActive: string;
      }>
    >`
      SELECT 
        u."id" AS "userId",
        u."email",
        u."name" AS "userName",
        COUNT(s."id") AS "sessionCount",
        MAX(s."createdAt") AS "lastActive"
      FROM "User" u
      LEFT JOIN "Session" s ON u."id" = s."userId"
      ${Prisma.raw(whereClause)}
      GROUP BY u."id", u."email", u."name"
      HAVING COUNT(s."id") >= ${minSessionCount}
      ORDER BY MAX(s."createdAt") DESC
      LIMIT ${limit}
    `;

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
