import 'dotenv/config'
import './config/database.ts'
import app from './app.ts'
import { DEFAULT_PORT } from './constants/index.ts'
import { env } from './utils/env.ts'
import { logInfo } from './utils/logger.ts'

const port = env('PORT') === '' ? DEFAULT_PORT : env('PORT')

app.listen(port, () => {
  logInfo(`Server running at ${port} port`)
})
