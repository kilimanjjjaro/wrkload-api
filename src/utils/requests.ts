import type { ListQuery } from '../types/requests.ts'

export const routeParam = (value: string | string[]) =>
  typeof value === 'string' ? value : value.join('/')

export const queryText = (value: unknown) =>
  typeof value === 'string' ? value : undefined

export const listQuery = (query: Record<string, unknown>): ListQuery => {
  const { page, limit, search } = query

  return {
    page: typeof page === 'number' ? page : queryText(page),
    limit: queryText(limit),
    search: queryText(search)
  }
}
