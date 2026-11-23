import type { RequestHandler } from 'express'
import { User } from '../models/User.ts'
import { Project } from '../models/Project.ts'
import { Task } from '../models/Task.ts'
import {
  EMPTY_LENGTH,
  HTTP_STATUS_OK,
  ROLE_ADMIN,
  RECENT_ACTIVITY_HOURS,
  ROLE_PARTNER,
  TRIAL_ACCOUNT_ID
} from '../constants/index.ts'
import type { RouteParams, UpdateBody } from '../types/requests.ts'
import { listQuery, queryText, routeParam } from '../utils/requests.ts'
import { logError } from '../utils/logger.ts'
import {
  paginationOptions,
  searchPattern,
  updatedFields
} from '../utils/pagination.ts'
import dayjs from 'dayjs'

const UPDATABLE_FIELDS = new Set(['username', 'avatar'])

export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    if (req.role === ROLE_PARTNER) throw new Error('Permission denied')

    const username = searchPattern(queryText(req.query.search))
    const users = await User.paginate(
      username === undefined ? {} : { username },
      paginationOptions(
        'username role registeredAt lastActiveAt recentlyActive email avatar confirmationStatus',
        listQuery(req.query)
      )
    )

    if (users.docs.length === EMPTY_LENGTH) {
      res.status(HTTP_STATUS_OK).json({
        status: 'ok',
        pagination: null,
        users: []
      })
      return
    }

    const lastHour = dayjs().subtract(RECENT_ACTIVITY_HOURS, 'hour')

    for (const user of users.docs) {
      user.recentlyActive = dayjs(user.lastActiveAt).isAfter(lastHour)
    }

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      pagination: {
        totalResults: users.totalDocs,
        resultsPerPage: users.limit,
        prevPage: users.prevPage,
        page: users.page,
        nextPage: users.nextPage
      },
      users: users.docs
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const uid = routeParam(req.params.uid)
    const user = await User.findById(uid)

    if (user === null) throw new Error("User doesn't exist")

    if (!user._id.equals(req.uid) && req.role === ROLE_PARTNER)
      throw new Error('Permission denied')

    res.status(HTTP_STATUS_OK).json({
      status: 'ok',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        registeredAt: user.registeredAt,
        lastActiveAt: user.lastActiveAt,
        recentlyActive: user.recentlyActive,
        email: user.email,
        avatar: user.avatar,
        confirmationStatus: user.confirmationStatus
      }
    })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const uid = routeParam(req.params.uid)

    if (uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    if (req.role !== ROLE_ADMIN && req.uid?.toString() !== uid)
      throw new Error('Permission denied')

    const user = await User.findOneAndDelete({ _id: uid })

    if (user === null) throw new Error('User not found')

    await Task.deleteMany({ authorId: uid })

    await Project.deleteMany({ authorId: uid })

    res.status(HTTP_STATUS_OK).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const updateUser: RequestHandler<
  RouteParams,
  unknown,
  UpdateBody
> = async (req, res, next) => {
  try {
    const uid = routeParam(req.params.uid)

    if (uid === TRIAL_ACCOUNT_ID) throw new Error('Trial account detected')

    const user = await User.findById(uid)

    if (user === null) throw new Error('User not found')

    if (!user._id.equals(req.uid)) throw new Error('Permission denied')

    const reqUser = updatedFields(req.body)

    if (Object.keys(reqUser).some((field) => !UPDATABLE_FIELDS.has(field)))
      throw new Error('Permission denied')

    const updatedUser = await User.findOneAndUpdate({ _id: uid }, reqUser, {
      returnDocument: 'after'
    })

    if (updatedUser === null) throw new Error('User not found')

    const secureUser = {
      _id: updatedUser._id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      role: updatedUser.role
    }

    res.status(HTTP_STATUS_OK).json({ status: 'ok', user: secureUser })
  } catch (error) {
    logError(error)
    next(error)
  }
}
