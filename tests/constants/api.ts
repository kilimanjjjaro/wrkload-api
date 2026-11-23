export const TRIAL_ACCOUNT_ID = '6439b01cf35b6e22570cd842'

export const ROLES = {
  admin: 1,
  trial: 2,
  partner: 3
} as const

export const DEFAULT_PASSWORD = 'super-secret-password'

export const LEGACY_PASSWORD_HASH =
  '$2a$10$Nyf4K1Wdk1N9J4vl.C9vT.g46D5nlnE/LoYB.12PzGFe6LnCfTOum'

export const ACCESS_TOKEN_EXPIRES_IN = 60 * 15

export const API = {
  auth: '/api/v1/auth',
  tasks: '/api/v1/tasks',
  projects: '/api/v1/projects',
  users: '/api/v1/users',
  dummy: '/api/v1/dummy'
} as const
