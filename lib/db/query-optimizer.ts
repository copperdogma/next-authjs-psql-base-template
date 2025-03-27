/**
 * QueryOptimizer provides utility functions for optimizing Prisma queries
 * based on common access patterns and performance best practices.
 */

// Type for pagination configuration
interface PaginationConfig<T> {
  take: number;
  skip: number;
  orderBy: Partial<Record<keyof T, 'asc' | 'desc'>>;
  cursor?: Partial<Record<keyof T, string | number | Date>>;
}

// Type for search condition
interface SearchCondition {
  contains: string;
  mode: 'insensitive';
}

// Type for date filter
interface DateFilter {
  gt?: Date;
  lt?: Date;
  gte?: Date;
  lte?: Date;
}

export class QueryOptimizer {
  /**
   * Generates an optimized select statement that only retrieves the fields
   * needed for a specific view, improving query performance.
   *
   * @param fields Fields to include in the select statement
   * @returns A Prisma select object that can be used in queries
   */
  static selectOnly<T extends Record<string, unknown>>(
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
  static cursorPagination<T extends Record<string, unknown>>(
    options: {
      cursor?: string | number | Date;
      cursorField?: keyof T;
      take?: number;
      skip?: number;
      orderBy?: keyof T;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): PaginationConfig<T> {
    const {
      cursor,
      cursorField = 'id' as keyof T,
      take = 20,
      skip = 0,
      orderBy = 'createdAt' as keyof T,
      orderDirection = 'desc',
    } = options;

    const paginationConfig: PaginationConfig<T> = {
      take,
      skip,
      orderBy: { [orderBy]: orderDirection } as Partial<Record<keyof T, 'asc' | 'desc'>>,
    };

    // Add cursor for efficient pagination if provided
    if (cursor) {
      paginationConfig.cursor = {
        [cursorField]: cursor,
      } as Partial<Record<keyof T, string | number | Date>>;
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
  static multiFieldSearch<T extends Record<string, unknown>>(
    searchTerm: string,
    fields: (keyof T)[]
  ): { OR: Partial<Record<keyof T, SearchCondition>>[] } | Record<string, never> {
    if (!searchTerm?.trim()) {
      return {};
    }

    // Create an array of conditions, one for each field
    const searchConditions = fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    })) as Partial<Record<keyof T, SearchCondition>>[];

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
  static selectWithCounts<T extends Record<string, unknown>, R extends Record<string, unknown>>(
    modelFields: (keyof T)[],
    countFields: (keyof R)[]
  ): {
    [K in keyof T]?: true;
  } & {
    _count: {
      select: Record<keyof R, true>;
    };
  } {
    const select = this.selectOnly<T>(modelFields);

    return {
      ...select,
      _count: {
        select: countFields.reduce(
          (countSelect, field) => {
            countSelect[field] = true;
            return countSelect;
          },
          {} as Record<keyof R, true>
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
  static dateFilter<T extends Record<string, unknown>>(
    field: keyof T,
    options: {
      before?: Date;
      after?: Date;
      exactDay?: Date;
    }
  ): Record<keyof T, DateFilter> {
    const { before, after, exactDay } = options;
    const filter = {} as Record<keyof T, DateFilter>;

    if (exactDay) {
      // Filter for exact day by setting start and end of day
      const startOfDay = new Date(exactDay);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(exactDay);
      endOfDay.setHours(23, 59, 59, 999);

      filter[field] = {
        gte: startOfDay,
        lte: endOfDay,
      };
      return filter;
    }

    if (before) {
      filter[field] = {
        ...(filter[field] || {}),
        lt: before,
      };
    }

    if (after) {
      filter[field] = {
        ...(filter[field] || {}),
        gt: after,
      };
    }

    return filter;
  }
}
