export {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED
} from '../../src/constants/index.ts'

export const HTTP_STATUS_NO_CONTENT = 204

export const TRIAL_ACCOUNT_ID = '6439b01cf35b6e22570cd842'

export const ROLE_ADMIN = 1
export const ROLE_TRIAL = 2
export const ROLE_PARTNER = 3

export const DEFAULT_PASSWORD = 'super-secret-password'

export const LEGACY_PASSWORD_HASH =
  '$2a$10$Nyf4K1Wdk1N9J4vl.C9vT.g46D5nlnE/LoYB.12PzGFe6LnCfTOum'

export const ACCESS_TOKEN_EXPIRES_IN = 900
export const REFRESH_TOKEN_EXPIRES_IN = 2_592_000
export const ONE_DAY_IN_SECONDS = 86_400
export const TEST_TOKEN_EXPIRES_IN = 60
export const EXPIRED_TOKEN_EXPIRES_IN = -1

export const API = {
  auth: '/api/v1/auth',
  tasks: '/api/v1/tasks',
  projects: '/api/v1/projects',
  users: '/api/v1/users',
  dummy: '/api/v1/dummy'
} as const

export const FIRST_VERSION = 0
export const NO_TASKS = 0
export const NO_DOCUMENTS = 0
export const SINGLE_DOCUMENT = 1
export const TWO_DOCUMENTS = 2
export const THREE_DOCUMENTS = 3
export const FIVE_DOCUMENTS = 5

export const FIRST_PAGE = 1
export const SECOND_PAGE = 2
export const THIRD_PAGE = 3

export const MINUTES_ACTIVE_RECENTLY = 10
export const HOURS_ACTIVE_EARLIER = 2
export const DAYS_ACTIVE_BEFORE = 2
export const PREVIOUS_MONTH_OFFSET = 1

export const TEST_NOW = new Date('2026-11-15T12:00:00')
export const TEST_AFTERNOON = new Date('2026-11-23T15:00:00')
export const TEST_NEXT_MONTH = new Date('2026-12-02T12:00:00')

export const PAST_MONTH_HOURS = 1
export const CURRENT_MONTH_HOURS = 4

export const SMTP_SSL_PORT = 465
export const SINGLE_CALL = 1
