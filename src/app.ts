import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.ts'
import tasksRouter from './routes/tasks.routes.ts'
import usersRouter from './routes/users.routes.ts'
import dummyRouter from './routes/dummy.routes.ts'
import projectsRouter from './routes/projects.routes.ts'
import errorsHandler from './middlewares/errorsHandler.middleware.ts'
import { health } from './controllers/health.controllers.ts'
import { TRUSTED_PROXY_HOPS } from './constants/index.ts'

const app = express()

app.set('trust proxy', TRUSTED_PROXY_HOPS)

const whiteList = [process.env.FRONTEND_URL]

app.use(
  cors({
    origin: (origin, callback) => {
      if (origin === undefined || origin === '' || whiteList.includes(origin)) {
        callback(null, origin)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true
  })
)

app.use(express.json())
app.use(cookieParser())

app.get('/health', health)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/tasks', tasksRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/dummy', dummyRouter)

app.use(errorsHandler)

export default app
