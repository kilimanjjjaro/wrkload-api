import type { RequestHandler } from 'express'
import dayjs from 'dayjs'
import { Project } from '../models/Project.ts'
import { Task } from '../models/Task.ts'
import { User } from '../models/User.ts'
import {
  EMPTY_LENGTH,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
  ROLE_ADMIN,
  TRIAL_ACCOUNT_ID
} from '../constants/index.ts'
import type { ProjectBody, RouteParams, UpdateBody } from '../types/requests.ts'
import { listQuery, queryText, routeParam } from '../utils/requests.ts'
import { logError } from '../utils/logger.ts'
import {
  paginationOptions,
  searchPattern,
  updatedFields
} from '../utils/pagination.ts'
import { getBestProjectOfPastMonth } from '../utils/stats.ts'
import { capitalize } from './tasks.controllers.ts'

const READ_ONLY_FIELDS = ['authorId', 'id', '_id', 'createdAt']

export const getProjects: RequestHandler = async (req, res, next) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    )

    const name = searchPattern(queryText(req.query.search))
    const projects = await Project.paginate(
      { authorId: req.uid, ...(name === undefined ? {} : { name }) },
      paginationOptions(
        'name authorId createdAt totalTasks',
        listQuery(req.query)
      )
    )

    if (projects.docs.length === EMPTY_LENGTH) {
      res.status(HTTP_STATUS_OK).json({
        status: 'ok',
        pagination: null,
        projects: []
      })
      return
    }

    for (const project of projects.docs) {
      void Task.find({ project: project.name, authorId: req.uid }).then(
        (tasks) => {
          project.set('totalTasks', tasks.length)
          void project.save()
        }
      )
    }

    const tasksForStats = await Task.paginate(
      { authorId: req.uid },
      {
        select: 'project deliveredAt',
        pagination: false
      }
    )

    const bestProjectOfPastMonth = getBestProjectOfPastMonth(tasksForStats.docs)

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      pagination: {
        totalResults: projects.totalDocs,
        resultsPerPage: projects.limit,
        prevPage: projects.prevPage,
        page: projects.page,
        nextPage: projects.nextPage
      },
      projects: projects.docs,
      stats: {
        bestProjectOfPastMonth
      }
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)
    const project = await Project.findById(id)

    if (project === null) throw new Error('Project not found')

    if (req.role !== ROLE_ADMIN && project.authorId?.equals(req.uid) !== true) {
      throw new Error("Can't read other authors projects")
    }

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      project: {
        _id: project._id,
        name: project.name,
        authorId: project.authorId,
        createdAt: project.createdAt,
        totalTasks: project.totalTasks
      }
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const createProject: RequestHandler<
  RouteParams,
  unknown,
  ProjectBody
> = async (req, res, next) => {
  try {
    const {
      body: { name: projectName }
    } = req
    const name = capitalize(projectName)

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const exists = await Project.findOne({ name, authorId: req.uid })

    if (exists !== null) throw new Error('Project already exists')

    const project = new Project({
      name,
      authorId: req.uid,
      createdAt: dayjs().format()
    })

    const newProject = await project.save()

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok', newProject })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const project = await Project.findOneAndDelete({
      _id: id,
      authorId: req.uid
    })

    if (project === null) throw new Error('Project not found')

    await Task.deleteMany({ project: project.name, authorId: req.uid })

    res.status(HTTP_STATUS_OK).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const updateProject: RequestHandler<
  RouteParams,
  unknown,
  UpdateBody
> = async (req, res, next) => {
  try {
    const id = routeParam(req.params.id)

    if (req.uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const project = await Project.findById(id)

    if (project === null) throw new Error('Project not found')

    if (project.authorId?.equals(req.uid) !== true)
      throw new Error("Can't update other authors projects")

    const reqProject = updatedFields(req.body)

    if (READ_ONLY_FIELDS.some((field) => Boolean(reqProject[field])))
      throw new Error("Can't update this data")

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id },
      reqProject,
      { returnDocument: 'after' }
    )

    res.status(HTTP_STATUS_OK).json({ status: 'ok', updatedProject })
  } catch (error) {
    logError(error)
    next(error)
  }
}
