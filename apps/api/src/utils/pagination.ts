import type { Pagination } from '@repo/packages-types/pagination';

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number
): PaginationResponse {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function buildPrismaQuery({ page, limit }: Pagination) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

export function buildWhereClause(filters: Record<string, unknown>) {
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'search') {
        // Search functionality - will be used by different resources
        return;
      }
      where[key] = value;
    }
  });

  return where;
}
