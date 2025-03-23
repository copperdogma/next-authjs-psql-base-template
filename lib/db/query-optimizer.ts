import { Prisma } from '@prisma/client';

/**
 * QueryOptimizer provides utility functions for optimizing Prisma queries
 * based on common access patterns and performance best practices.
 */
export class QueryOptimizer {
  /**
   * Generates an optimized select statement that only retrieves the fields
   * needed for a specific view, improving query performance.
   *
   * @param fields Fields to include in the select statement
   * @returns A Prisma select object that can be used in queries
   */
  static selectOnly<T extends Record<string, any>>(
    fields: (keyof T)[]
  ): Partial<Record<keyof T, true>> {
    return fields.reduce(
      (select, field) => {
        select[field] = true;
        return select;
      },
      {} as Partial<Record<keyof T, true>>
    );
  }

  /**
   * Creates a cursor-based pagination config for more efficient pagination compared to
   * offset-based pagination, especially for large datasets.
   *
   * @param options Pagination options including cursor, field to use as cursor, and take count
   * @returns Prisma pagination args that can be used in a findMany query
   */
  static cursorPagination<T extends Record<string, any>>(
    options: {
      cursor?: string | number | Date;
      cursorField?: keyof T;
      take?: number;
      skip?: number;
      orderBy?: keyof T;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): any {
    const {
      cursor,
      cursorField = 'id' as keyof T,
      take = 20,
      skip = 0,
      orderBy = 'createdAt' as keyof T,
      orderDirection = 'desc',
    } = options;

    const paginationConfig: any = {
      take,
      skip,
      orderBy: { [orderBy as string]: orderDirection },
    };

    // Add cursor for efficient pagination if provided
    if (cursor) {
      paginationConfig.cursor = {
        [cursorField as string]: cursor,
      };
      // Skip 1 to exclude the cursor item itself
      paginationConfig.skip = 1;
    }

    return paginationConfig;
  }

  /**
   * Creates a filter for searching across multiple text fields
   * in a more optimized way than running multiple separate contains queries.
   *
   * @param searchTerm The term to search for
   * @param fields Fields to search in
   * @returns A Prisma where condition for OR-based text search
   */
  static multiFieldSearch<T extends Record<string, any>>(
    searchTerm: string,
    fields: (keyof T)[]
  ): any {
    if (!searchTerm?.trim()) {
      return {};
    }

    // Create an array of conditions, one for each field
    const searchConditions = fields.map(field => ({
      [field as string]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    }));

    // Combine with OR
    return {
      OR: searchConditions,
    };
  }

  /**
   * Generates a select statement with nested aggregations,
   * useful for efficiently retrieving counts without separate queries.
   *
   * @param modelFields Base model fields to select
   * @param countFields Related models to count
   * @returns A Prisma select object with _count nested selects
   */
  static selectWithCounts<T extends Record<string, any>, R extends Record<string, any>>(
    modelFields: (keyof T)[],
    countFields: (keyof R)[]
  ): any {
    const select = this.selectOnly<T>(modelFields);

    return {
      ...select,
      _count: {
        select: countFields.reduce(
          (countSelect, field) => {
            countSelect[field as string] = true;
            return countSelect;
          },
          {} as Record<string, boolean>
        ),
      },
    };
  }

  /**
   * Creates a where condition for filtering records by date range.
   *
   * @param field The date field to filter on
   * @param options Date range options (before, after, between)
   * @returns A Prisma where condition for date filtering
   */
  static dateFilter<T extends Record<string, any>>(
    field: keyof T,
    options: {
      before?: Date;
      after?: Date;
      exactDay?: Date;
    }
  ): any {
    const { before, after, exactDay } = options;
    const filter: any = {};

    if (exactDay) {
      // Filter for exact day by setting start and end of day
      const startOfDay = new Date(exactDay);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(exactDay);
      endOfDay.setHours(23, 59, 59, 999);

      filter[field as string] = {
        gte: startOfDay,
        lte: endOfDay,
      };
      return filter;
    }

    if (before) {
      filter[field as string] = {
        ...(filter[field as string] || {}),
        lt: before,
      };
    }

    if (after) {
      filter[field as string] = {
        ...(filter[field as string] || {}),
        gt: after,
      };
    }

    return filter;
  }
}
