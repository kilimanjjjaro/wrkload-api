import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.ts'
import tasksRouter from './routes/tasks.routes.ts'
import usersRouter from './routes/users.routes.ts'
import dummyRouter from './routes/dummy.routes.ts'
import projectsRouter from './routes/projects.routes.ts'
import errorsHandler from './middlewares/errorsHandler.middleware.ts'

const app = express()

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

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/tasks', tasksRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/dummy', dummyRouter)

app.use(errorsHandler)

export default app
