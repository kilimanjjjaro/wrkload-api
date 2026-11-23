import type { PaginateOptions } from 'mongoose'
import { DECIMAL_RADIX, EMPTY_LENGTH } from '../constants/index.ts'
import type { ListQuery } from '../types/requests.ts'

export const paginationOptions = (
  select: string,
  { page, limit }: ListQuery
): PaginateOptions => {
  if (limit === undefined || limit === '') return { select, pagination: false }

  return {
    select,
    page: parseInt(String(page), DECIMAL_RADIX),
    limit: Number.isNaN(Number(limit))
      ? Number.NaN
      : parseInt(limit, DECIMAL_RADIX)
  }
}

const escapeRegExp = (text: string) =>
  text.replace(/[\\^$.*+?\(\)\[\]\{\}\|\/\-]/gv, '\\$&')

export const searchPattern = (search: string | undefined) =>
  search === undefined || search.length === EMPTY_LENGTH
    ? undefined
    : { $regex: escapeRegExp(search.replace(/^"|"$/gv, '')), $options: 'i' }

export const updatedFields = (body: Record<string, unknown>) => {
  const entries = Object.entries(body).filter(([, value]) => Boolean(value))

  if (entries.length === EMPTY_LENGTH) throw new Error('Nothing to update')

  return Object.fromEntries(entries)
}
