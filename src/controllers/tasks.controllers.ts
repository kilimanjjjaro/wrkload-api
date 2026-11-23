import type { RequestHandler } from 'express'
import dayjs from 'dayjs'
import { Task } from '../models/Task.ts'
import { User } from '../models/User.ts'
import {
  EMPTY_LENGTH,
  FIRST_INDEX,
  FIRST_LETTER_LENGTH,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
  ROLE_ADMIN,
  TRIAL_ACCOUNT_ID
} from '../constants/index.ts'
import type { RouteParams, TaskBody, UpdateBody } from '../types/requests.ts'
import { listQuery, queryText, routeParam } from '../utils/requests.ts'
import { logError } from '../utils/logger.ts'
import {
  paginationOptions,
  searchPattern,
  updatedFields
} from '../utils/pagination.ts'
import {
  getCurrentMonthTasks,
  getPastMonthTasks,
  getTotalTasksTiming,
  isPerformanceBetter
} from '../utils/stats.ts'

const UPDATABLE_FIELDS = new Set([
  'title',
  'project',
  'timing',
  'deliveredAt',
  'description'
])

export const capitalize = (string: string) =>
  string
    .split(' ')
    .map(
      (word) =>
        word.charAt(FIRST_INDEX).toUpperCase() + word.slice(FIRST_LETTER_LENGTH)
    )
    .join(' ')

export const getTasks: RequestHandler = async (req, res, next) => {
  try {
    const project = capitalize(queryText(req.query.project) ?? '')

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    )

    const title = searchPattern(queryText(req.query.search))
    const tasks = await Task.paginate(
      { authorId: req.uid, project, ...(title === undefined ? {} : { title }) },
      paginationOptions(
        'title authorId createdAt updatedAt project timing deliveredAt description',
        listQuery(req.query)
      )
    )

    if (tasks.docs.length === EMPTY_LENGTH) {
      res.status(HTTP_STATUS_OK).json({
        status: 'ok',
        pagination: null,
        tasks: [],
        stats: null
      })
      return
    }

    const tasksForStats = await Task.paginate(
      { authorId: req.uid, project },
      {
        select: 'deliveredAt timing',
        pagination: false
      }
    )

    const pastMonthTasks = getPastMonthTasks(tasksForStats.docs)
    const currentMonthTasks = getCurrentMonthTasks(tasksForStats.docs)
    const totalPastMonthTiming = getTotalTasksTiming(pastMonthTasks)
    const totalCurrentMonthTiming = getTotalTasksTiming(currentMonthTasks)

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      pagination: {
        totalResults: tasks.totalDocs,
        resultsPerPage: tasks.limit,
        prevPage: tasks.prevPage,
        page: tasks.page,
        nextPage: tasks.nextPage
      },
      tasks: tasks.docs,
      stats: {
        totalPastMonthTiming,
        totalTasksPastMonth: pastMonthTasks.length,
        totalCurrentMonthTiming,
        totalTasksCurrentMonth: currentMonthTasks.length,
        performance: isPerformanceBetter(
          totalCurrentMonthTiming,
          totalPastMonthTiming
        )
      }
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const getTask: RequestHandler = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)
    const task = await Task.findById(id)

    if (task === null) throw new Error('Task not found')

    if (req.role !== ROLE_ADMIN && task.authorId?.equals(req.uid) !== true) {
      throw new Error("Can't read other authors tasks")
    }

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      task: {
        _id: task._id,
        title: task.title,
        authorId: task.authorId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        project: task.project,
        timing: task.timing,
        deliveredAt: task.deliveredAt,
        description: task.description
      }
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const createTask: RequestHandler<
  RouteParams,
  unknown,
  TaskBody
> = async (req, res, next) => {
  try {
    const {
      body: { title, project, timing, deliveredAt, description }
    } = req

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const task = new Task({
      title,
      authorId: req.uid,
      createdAt: dayjs().format(),
      project,
      timing,
      deliveredAt: dayjs(deliveredAt).format('YYYY-MM-DD'),
      description
    })

    const newTask = await task.save()

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok', newTask })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const task = await Task.findOneAndDelete({ _id: id, authorId: req.uid })

    if (task === null) throw new Error('Task not found')

    res.status(HTTP_STATUS_OK).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const updateTask: RequestHandler<
  RouteParams,
  unknown,
  UpdateBody
> = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const task = await Task.findById(id)

    if (task === null) throw new Error('Task not found')

    if (task.authorId?.equals(req.uid) !== true)
      throw new Error("Can't update other authors tasks")

    const reqTask = updatedFields(req.body)

    if (Object.keys(reqTask).some((field) => !UPDATABLE_FIELDS.has(field)))
      throw new Error("Can't update this data")

    reqTask.updatedAt = dayjs().format()

    if (typeof reqTask.deliveredAt === 'string')
      reqTask.deliveredAt = dayjs(reqTask.deliveredAt).format('YYYY-MM-DD')

    const updatedTask = await Task.findOneAndUpdate({ _id: id }, reqTask, {
      returnDocument: 'after'
    })

    res.status(HTTP_STATUS_OK).json({ status: 'ok', updatedTask })
  } catch (error) {
    logError(error)
    next(error)
  }
}
