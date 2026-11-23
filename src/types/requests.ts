export type RouteParams = Record<string, string | string[]>

export interface ListQuery {
  page?: string | number
  limit?: string
  search?: string
}

export interface RegisterBody {
  username: string
  email: string
  avatar: string
  password: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface EmailBody {
  email: string
}

export interface ChangePasswordBody {
  email: string
  oldPassword: string
  newPassword: string
}

export interface ResetPasswordBody {
  newPassword: string
}

export interface TaskBody {
  title: string
  project: string
  timing: string
  deliveredAt: string
  description?: string
}

export interface ProjectBody {
  name: string
}

export type UpdateBody = Record<string, unknown>
