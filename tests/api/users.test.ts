import dayjs from 'dayjs'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import { Project } from '../../src/models/Project.ts'
import { Task } from '../../src/models/Task.ts'
import { User } from '../../src/models/User.ts'
import { API, ROLES, TRIAL_ACCOUNT_ID } from '../constants/api.ts'
import { createProject, createTask } from '../utils/tasks.ts'
import { createUser, createUserWithToken } from '../utils/users.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /users', () => {
  it('lists the users for an admin and flags the recently active ones', async () => {
    const { authorization } = await createUserWithToken({
      username: 'admin',
      role: ROLES.admin
    })
    await createUser({
      username: 'active',
      lastActiveAt: dayjs().subtract(10, 'minute').format()
    })
    await createUser({
      username: 'inactive',
      lastActiveAt: dayjs().subtract(2, 'day').format()
    })

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body.pagination).toMatchObject({ totalResults: 3 })

    const users = Object.fromEntries(
      response.body.users.map(
        (user: { username: string; recentlyActive: boolean }) => [
          user.username,
          user.recentlyActive
        ]
      )
    )
    expect(users).toEqual({ admin: false, active: true, inactive: false })
    expect(response.body.users[0]).not.toHaveProperty('password')
  })

  it.fails(
    'does not flag a user active more than an hour ago today',
    async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 23, 15) })
      const { authorization } = await createUserWithToken({ role: ROLES.admin })
      await createUser({
        username: 'inactive',
        lastActiveAt: dayjs().subtract(2, 'hour').format()
      })

      const response = await request(app)
        .get(`${API.users}?search=inactive`)
        .set('Authorization', authorization)

      expect(response.body.users[0].recentlyActive).toBe(false)
    }
  )

  it('lets the trial account list the users', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLES.trial
    })

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
  })

  it('searches and paginates the users', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    await createUser({ username: 'kili one' })
    await createUser({ username: 'KILI two' })

    const response = await request(app)
      .get(`${API.users}?search="kili"&limit=1&page=2`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(
      response.body.users.map((user: { username: string }) => user.username)
    ).toEqual(['KILI two'])
    expect(response.body.pagination).toMatchObject({
      totalResults: 2,
      page: 2,
      prevPage: 1
    })
  })

  it('rejects a partner', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('users/permission-denied')
  })
})

describe('GET /users/:uid', () => {
  it('returns the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: ROLES.partner
    })
    expect(response.body.user).not.toHaveProperty('password')
  })

  it('rejects another user for a partner', async () => {
    const { authorization } = await createUserWithToken()
    const other = await createUser()

    const response = await request(app)
      .get(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('users/permission-denied')
  })

  it('returns another user for an admin', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    const other = await createUser()

    const response = await request(app)
      .get(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
  })

  it('returns 404 for a missing user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })

    const response = await request(app)
      .get(`${API.users}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('users/user-not-found')
  })
})

describe('PATCH /users/:uid', () => {
  it('updates the username and avatar of the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: 'New name', avatar: 'https://wrkload.test/new.png' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: 'New name',
        avatar: 'https://wrkload.test/new.png',
        role: ROLES.partner
      }
    })
  })

  it('fails without fields to update', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: '' })

    expect(response.status).toBe(500)
    expect(response.body.code).toBe('server/unhandled-error')
  })

  it('rejects changing the password or the role', async () => {
    const { user, authorization } = await createUserWithToken()

    for (const body of [{ password: 'new-password' }, { role: ROLES.admin }]) {
      const response = await request(app)
        .patch(`${API.users}/${user._id.toString()}`)
        .set('Authorization', authorization)
        .send({ username: 'New name', ...body })

      expect(response.status).toBe(401)
      expect(response.body.code).toBe('users/permission-denied')
    }

    expect((await User.findById(user._id))?.role).toBe(ROLES.partner)
  })

  it.fails('rejects changing the email or the confirmation', async () => {
    const { user, authorization } = await createUserWithToken({
      confirmed: false
    })

    await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ email: 'stolen@wrkload.test', confirmationStatus: true })

    const updated = await User.findById(user._id)
    expect(updated?.email).toBe(user.email)
    expect(updated?.confirmationStatus).toBe(false)
  })

  it('rejects another user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    const other = await createUser()

    const response = await request(app)
      .patch(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: 'New name' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('users/permission-denied')
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLES.trial
    })

    const response = await request(app)
      .patch(`${API.users}/${TRIAL_ACCOUNT_ID}`)
      .set('Authorization', authorization)
      .send({ username: 'New name' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
  })
})

describe('DELETE /users/:uid', () => {
  it('deletes the user with their projects and tasks', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    const other = await createUser()
    await createProject(other._id)
    await createTask(other._id)

    const response = await request(app)
      .delete(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(await User.findById(other._id)).toBeNull()
    expect(await Project.countDocuments({ authorId: other._id })).toBe(0)
    expect(await Task.countDocuments({ authorId: other._id })).toBe(0)
  })

  it.fails('rejects a partner deleting another user', async () => {
    const { authorization } = await createUserWithToken()
    const other = await createUser()

    const response = await request(app)
      .delete(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(await User.findById(other._id)).not.toBeNull()
  })

  it('does not delete the trial account', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLES.trial })

    const response = await request(app)
      .delete(`${API.users}/${TRIAL_ACCOUNT_ID}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
  })

  it('returns 403 for a missing user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })

    const response = await request(app)
      .delete(`${API.users}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/user-not-found')
  })
})
