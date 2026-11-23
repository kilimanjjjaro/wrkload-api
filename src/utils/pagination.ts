import type { PaginateOptions } from 'mongoose'

export const paginationOptions = (
  select: string,
  page: unknown,
  limit: unknown
): PaginateOptions => {
  if (!limit) return { select, pagination: false }

  return {
    select,
    page: parseInt(String(page), 10),
    limit: Number.isNaN(Number(limit))
      ? Number.NaN
      : parseInt(String(limit), 10)
  }
}
