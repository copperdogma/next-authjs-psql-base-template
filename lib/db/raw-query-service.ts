import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Service for executing optimized raw SQL queries for complex operations
 * that would be inefficient with standard Prisma query methods.
 *
 * This demonstrates how to use Prisma's executeRaw and queryRaw for
 * performance-critical operations.
 */
export class RawQueryService {
  /**
   * Performs a complex aggregation using raw SQL
   * Example: Get user session counts grouped by day for analytics
   *
   * @param options Query options
   * @returns Array of daily session counts
   */
  static async getUserSessionCountsByDay(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<{ date: string; count: number }[]> {
    const { startDate, endDate, userId } = options;

    // Build query parameters
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

    // Execute the raw query
    const results = await prisma.$queryRaw<{ date: string; count: string }[]>`
      SELECT 
        DATE_TRUNC('day', "createdAt") AS date,
        COUNT(*) AS count
      FROM "Session"
      ${Prisma.raw(whereClause)}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `;

    // Transform the results (convert count to number)
    return results.map(row => ({
      date: row.date.toString(),
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Performs a batch update with complex conditions
   * Example: Update all expired sessions for specific users
   *
   * @param options Update options
   * @returns Number of updated records
   */
  static async extendSessionExpirations(options: {
    userIds: string[];
    extensionHours: number;
    currentExpiryBefore?: Date;
  }): Promise<number> {
    const { userIds, extensionHours, currentExpiryBefore } = options;

    if (!userIds.length) {
      return 0;
    }

    // Convert userIds array to SQL array
    const userIdsParam = userIds.map(id => `'${id}'`).join(',');

    // Build the WHERE clause
    let whereClause = `WHERE "userId" IN (${userIdsParam})`;

    if (currentExpiryBefore) {
      whereClause += ` AND "expiresAt" <= '${currentExpiryBefore.toISOString()}'`;
    }

    // Execute the update
    const result = await prisma.$executeRaw`
      UPDATE "Session"
      SET 
        "expiresAt" = "expiresAt" + interval '${extensionHours} hours',
        "updatedAt" = NOW()
      ${Prisma.raw(whereClause)}
    `;

    return result;
  }

  /**
   * Performs complex joins and aggregations that would be inefficient with Prisma
   * Example: Get active users with their session counts and latest activity
   *
   * @param options Query options
   * @returns Array of user activity summaries
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
    const { minSessionCount = 1, since, limit = 50 } = options;

    // Build the WHERE clause for date filtering
    let whereClause = '';
    if (since) {
      whereClause = `WHERE s."createdAt" >= '${since.toISOString()}'`;
    }

    // Execute the raw query
    const results = await prisma.$queryRaw<
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
  static async executeRawQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
    // Convert the SQL string and parameters to a tagged template literal that Prisma requires
    return prisma.$queryRaw(Prisma.raw(sql), ...params) as Promise<T>;
  }
}
