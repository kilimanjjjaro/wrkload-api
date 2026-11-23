import type { RequestHandler } from 'express'
import dayjs from 'dayjs'
import { Project } from '../models/Project.ts'
import { Task } from '../models/Task.ts'
import { User } from '../models/User.ts'
import { paginationOptions } from '../utils/pagination.ts'
import { getBestProjectOfPastMonth } from '../utils/stats.ts'
import { capitalize } from './tasks.controllers.ts'

export const getProjects: RequestHandler = async (req, res, next) => {
  try {
    let projects
    const search = req.query.search as string | undefined
    const projectPaginationOptions = paginationOptions(
      'name authorId createdAt totalTasks',
      req.query.page,
      req.query.limit
    )

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    )

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '')
      projects = await Project.paginate(
        { authorId: req.uid, name: { $regex: escapedString, $options: 'i' } },
        projectPaginationOptions
      )
    } else {
      projects = await Project.paginate(
        { authorId: req.uid },
        projectPaginationOptions
      )
    }

    if (projects.docs.length < 1)
      return res.status(200).json({
        status: 'ok',
        pagination: null,
        projects: []
      })

    projects.docs.forEach((project) => {
      void Task.find({ project: project.name, authorId: req.uid }).then(
        (tasks) => {
          project.totalTasks = tasks.length
          void project.save()
        }
      )
    })

    const tasksForStats = await Task.paginate(
      { authorId: req.uid },
      {
        select: 'project deliveredAt',
        pagination: false
      }
    )

    const bestProjectOfPastMonth = await getBestProjectOfPastMonth(
      tasksForStats.docs
    )

    res.status(200).json({
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
    console.error(error)
    next(error)
  }
}

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const project = await Project.findById(id)

    if (!project) throw new Error('Project not found')

    if (req.role !== 1 && !project.authorId?.equals(req.uid)) {
      throw new Error("Can't read other authors projects")
    }

    res.status(200).json({
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
    console.error(error)
    next(error)
  }
}

export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const name = capitalize(req.body.name)

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const exists = await Project.findOne({ name, authorId: req.uid })

    if (exists) throw new Error('Project already exists')

    const project = new Project({
      name,
      authorId: req.uid,
      createdAt: dayjs().format()
    })

    const newProject = await project.save()

    res.status(201).json({ status: 'ok', newProject })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const project = await Project.findOneAndDelete({
      _id: id,
      authorId: req.uid
    })

    if (!project) throw new Error('Project not found')

    await Task.deleteMany({ project: project.name, authorId: req.uid })

    res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    let reqProject: Record<string, unknown> | undefined
    const { id } = req.params as { id: string }

    if (req.uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const project = await Project.findById(id)

    if (!project) throw new Error('Project not found')

    if (!project.authorId?.equals(req.uid))
      throw new Error("Can't update other authors projects")

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqProject = Object.assign({}, reqProject, {
          [key]: req.body[key]
        })
      }
    }

    if (reqProject === undefined) throw new Error('Nothing to update')

    if (
      reqProject.authorId ||
      reqProject.id ||
      reqProject._id ||
      reqProject.createdAt
    )
      throw new Error("Can't update this data")

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id },
      reqProject,
      { returnDocument: 'after' }
    )

    res.status(200).json({ status: 'ok', updatedProject })
  } catch (error) {
    console.error(error)
    next(error)
  }
}
