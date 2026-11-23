import type { RequestHandler } from 'express'
import { User } from '../models/User.ts'
import { Project } from '../models/Project.ts'
import { Task } from '../models/Task.ts'
import { paginationOptions } from '../utils/pagination.ts'
import dayjs from 'dayjs'

export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    if (req.role === 3) throw new Error('Permission denied')

    let users
    const search = req.query.search as string | undefined
    const usersPaginationOptions = paginationOptions(
      'username role registeredAt lastActiveAt recentlyActive email avatar confirmationToken confirmationStatus',
      req.query.page,
      req.query.limit
    )

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '')
      users = await User.paginate(
        { username: { $regex: escapedString, $options: 'i' } },
        usersPaginationOptions
      )
    } else {
      users = await User.paginate({}, usersPaginationOptions)
    }

    if (users.docs.length < 1) {
      res.status(200).json({
        status: 'ok',
        pagination: null,
        users: []
      })
      return
    }

    const lastHour = dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')

    users.docs.forEach((user) => {
      if (user.lastActiveAt > lastHour) {
        user.recentlyActive = true
      } else {
        user.recentlyActive = false
      }
    })

    res.status(200).json({
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
    console.error(error)
    next(error)
  }
}

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.params as { uid: string }
    const user = await User.findById(uid)

    if (!user) throw new Error("User doesn't exist")

    if (!user._id.equals(req.uid) && req.role === 3)
      throw new Error('Permission denied')

    res.status(200).json({
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
        confirmationToken: user.confirmationToken,
        confirmationStatus: user.confirmationStatus
      }
    })
  } catch (error) {
    console.error(error)
    next(error)
  }
}
export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.params as { uid: string }

    if (uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const user = await User.findOneAndDelete({ _id: uid })

    if (!user) throw new Error('User not found')

    await Task.deleteMany({ authorId: uid })

    await Project.deleteMany({ authorId: uid })

    res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    let reqUser: Record<string, unknown> | undefined
    const { uid } = req.params as { uid: string }

    if (uid === '6439b01cf35b6e22570cd842')
      throw new Error('Trial account detected')

    const user = await User.findById(uid)

    if (!user) throw new Error('User not found')

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqUser = Object.assign({}, reqUser, {
          [key]: req.body[key]
        })
      }
    }

    if (!user._id.equals(req.uid)) throw new Error('Permission denied')

    if (reqUser === undefined) throw new Error('Nothing to update')

    if (reqUser.id || reqUser._id || reqUser.password || reqUser.role)
      throw new Error('Permission denied')

    const updatedUser = await User.findOneAndUpdate({ _id: uid }, reqUser, {
      returnDocument: 'after'
    })

    if (!updatedUser) throw new Error('User not found')

    const secureUser = {
      _id: updatedUser._id,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      role: updatedUser.role
    }

    res.status(200).json({ status: 'ok', user: secureUser })
  } catch (error) {
    console.error(error)
    next(error)
  }
}
