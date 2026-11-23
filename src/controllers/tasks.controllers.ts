import type { RequestHandler } from 'express'
import dayjs from 'dayjs'
import { Task } from '../models/Task.ts'
import { User } from '../models/User.ts'
import {
  getCurrentMonthTasks,
  getPastMonthTasks,
  getTotalTasksTiming,
  isPerformanceBetter
} from '../utils/stats.ts'
import { paginationOptions } from '../utils/pagination.ts'

export const capitalize = (string: string) => {
  const words = string.split(' ')
  const capitalizedWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
  return capitalizedWords.join(' ')
}

export const getTasks: RequestHandler = async (req, res, next) => {
  try {
    let tasks
    const project = capitalize(req.query.project as string)
    const search = req.query.search as string | undefined
    const tasksPaginationOptions = paginationOptions(
      'title authorId createdAt updatedAt project timing deliveredAt description',
      req.query.page,
      req.query.limit
    )
    let totalPastMonthTiming = 0
    let totalCurrentMonthTiming = 0

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    )

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '')
      tasks = await Task.paginate(
        {
          authorId: req.uid,
          project,
          title: { $regex: escapedString, $options: 'i' }
        },
        tasksPaginationOptions
      )
    } else {
      tasks = await Task.paginate(
        { authorId: req.uid, project },
        tasksPaginationOptions
      )
    }

    if (tasks.docs.length < 1) {
      res.status(200).json({
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

    if (pastMonthTasks.length >= 1) {
      totalPastMonthTiming = getTotalTasksTiming(pastMonthTasks)
    }

    const currentMonthTasks = getCurrentMonthTasks(tasksForStats.docs)

    if (currentMonthTasks.length >= 1) {
      totalCurrentMonthTiming = getTotalTasksTiming(currentMonthTasks)
    }

    res.status(200).json({
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
    console.error(error)
    next(error)
  }
}

export const getTask: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const task = await Task.findById(id)

    if (!task) throw new Error('Task not found')

    if (req.role !== 1 && !task.authorId?.equals(req.uid)) {
      throw new Error("Can't read other authors tasks")
    }

    res.status(200).json({
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
    console.error(error)
    next(error)
  }
}

export const createTask: RequestHandler = async (req, res, next) => {
  try {
    const { title, project, timing, deliveredAt, description } = req.body

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

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

    res.status(201).json({ status: 'ok', newTask })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const task = await Task.findOneAndDelete({ _id: id, authorId: req.uid })

    if (!task) throw new Error('Task not found')

    res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const updateTask: RequestHandler = async (req, res, next) => {
  try {
    let reqTask: Record<string, unknown> | undefined
    const { id } = req.params as { id: string }

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const task = await Task.findById(id)

    if (!task) throw new Error('Task not found')

    if (!task.authorId?.equals(req.uid))
      throw new Error("Can't update other authors tasks")

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqTask = Object.assign({}, reqTask, {
          [key]: req.body[key]
        })
      }
    }

    if (reqTask === undefined) throw new Error('Nothing to update')

    if (
      reqTask.authorId ||
      reqTask.id ||
      reqTask._id ||
      reqTask.createdAt ||
      reqTask.updatedAt
    )
      throw new Error("Can't update this data")

    reqTask.updatedAt = dayjs().format()

    const updatedTask = await Task.findOneAndUpdate({ _id: id }, reqTask, {
      returnDocument: 'after'
    })

    res.status(200).json({ status: 'ok', updatedTask })
  } catch (error) {
    console.error(error)
    next(error)
  }
}
