import type { z } from 'zod'
import { VALIDATION_ERRORS_SCHEMA } from '../constants/schemas.ts'

interface TestResponse {
  body: unknown
}

export const body = (response: TestResponse) => response.body

export const parseBody = <T extends z.ZodType>(
  schema: T,
  response: TestResponse
): z.infer<T> => schema.parse(response.body)

export const validationErrorPaths = (response: TestResponse) =>
  parseBody(VALIDATION_ERRORS_SCHEMA, response).error.map(({ path }) => path)

export const validationErrorMessages = (response: TestResponse) =>
  parseBody(VALIDATION_ERRORS_SCHEMA, response).error.map(({ msg }) => msg)
