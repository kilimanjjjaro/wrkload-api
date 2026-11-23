import { z } from 'zod'

export const VALIDATION_ERRORS_SCHEMA = z.object({
  error: z.array(z.object({ path: z.string() }))
})

export const ACCESS_TOKEN_SCHEMA = z.object({ accessToken: z.string() })

export const TOKEN_PAYLOAD_SCHEMA = z.object({
  iat: z.number(),
  exp: z.number()
})

export const NEW_DOCUMENT_SCHEMA = z.object({
  _id: z.string(),
  createdAt: z.string()
})

export const TASKS_SCHEMA = z.object({
  tasks: z.array(z.object({ title: z.string() }))
})

export const PROJECTS_SCHEMA = z.object({
  projects: z.array(z.object({ name: z.string() }))
})

export const USERS_SCHEMA = z.object({
  users: z.array(
    z.object({ username: z.string(), recentlyActive: z.boolean() })
  )
})

export const UPDATED_AT_SCHEMA = z.object({
  updatedTask: z.object({ updatedAt: z.string() })
})

export const NEW_PROJECT_SCHEMA = z.object({ newProject: NEW_DOCUMENT_SCHEMA })

export const NEW_TASK_SCHEMA = z.object({ newTask: NEW_DOCUMENT_SCHEMA })

export const STREAMED_MAIL_SCHEMA = z.object({ message: z.instanceof(Buffer) })
