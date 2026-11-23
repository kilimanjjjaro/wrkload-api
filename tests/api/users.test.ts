import dayjs from 'dayjs'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import { Project } from '../../src/models/Project.ts'
import { Task } from '../../src/models/Task.ts'
import { User } from '../../src/models/User.ts'
import { createProject, createTask } from '../utils/tasks.ts'
import { createUser, createUserWithToken } from '../utils/users.ts'
import {
  API,
  DAYS_ACTIVE_BEFORE,
  FIRST_PAGE,
  HOURS_ACTIVE_EARLIER,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  MINUTES_ACTIVE_RECENTLY,
  NO_DOCUMENTS,
  ROLE_ADMIN,
  ROLE_PARTNER,
  ROLE_TRIAL,
  SECOND_PAGE,
  TEST_AFTERNOON,
  THREE_DOCUMENTS,
  TRIAL_ACCOUNT_ID,
  TWO_DOCUMENTS
} from '../constants/api.ts'
import { USERS_SCHEMA } from '../constants/schemas.ts'
import { body, parseBody, validationErrorPaths } from '../utils/http.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /users', () => {
  it('lists the users for an admin and flags the recently active ones', async () => {
    const { authorization } = await createUserWithToken({
      username: 'admin',
      role: ROLE_ADMIN
    })
    await createUser({
      username: 'active',
      lastActiveAt: dayjs().subtract(MINUTES_ACTIVE_RECENTLY, 'minute').format()
    })
    await createUser({
      username: 'inactive',
      lastActiveAt: dayjs().subtract(DAYS_ACTIVE_BEFORE, 'day').format()
    })

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      pagination: { totalResults: THREE_DOCUMENTS }
    })

    const users = Object.fromEntries(
      parseBody(USERS_SCHEMA, response).users.map(
        ({ username, recentlyActive }) => [username, recentlyActive]
      )
    )
    expect(users).toEqual({ admin: false, active: true, inactive: false })
    expect(body(response)).not.toHaveProperty('users.0.password')
    expect(body(response)).not.toHaveProperty('users.0.confirmationToken')
  })

  it('does not flag a user active more than an hour ago today', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: TEST_AFTERNOON })
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    await createUser({
      username: 'inactive',
      lastActiveAt: dayjs().subtract(HOURS_ACTIVE_EARLIER, 'hour').format()
    })

    const response = await request(app)
      .get(`${API.users}?search=inactive`)
      .set('Authorization', authorization)

    expect(body(response)).toHaveProperty('users.0.recentlyActive', false)
  })

  it('lets the trial account list the users', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLE_TRIAL
    })

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
  })

  it('lists only the trial account to the trial account', async () => {
    await createUser({ username: 'Alice' })
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      username: 'Trial',
      role: ROLE_TRIAL
    })

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(USERS_SCHEMA, response).users.map(({ username }) => username)
    ).toEqual(['Trial'])
  })

  it('searches and paginates the users', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    await createUser({ username: 'kili one' })
    await createUser({ username: 'KILI two' })

    const response = await request(app)
      .get(`${API.users}?search="kili"&limit=1&page=2`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(USERS_SCHEMA, response).users.map(({ username }) => username)
    ).toEqual(['KILI two'])
    expect(body(response)).toMatchObject({
      pagination: {
        totalResults: TWO_DOCUMENTS,
        page: SECOND_PAGE,
        prevPage: FIRST_PAGE
      }
    })
  })

  it('rejects a partner', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(API.users)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'users/permission-denied' })
  })
})

describe('GET /users/:uid', () => {
  it('returns the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: ROLE_PARTNER
      }
    })
    expect(body(response)).not.toHaveProperty('user.password')
    expect(body(response)).not.toHaveProperty('user.confirmationToken')
  })

  it('rejects another user for a partner', async () => {
    const { authorization } = await createUserWithToken()
    const other = await createUser()

    const response = await request(app)
      .get(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'users/permission-denied' })
  })

  it('returns another user for an admin', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    const other = await createUser()

    const response = await request(app)
      .get(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
  })

  it('returns 404 for a missing user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })

    const response = await request(app)
      .get(`${API.users}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND)
    expect(body(response)).toMatchObject({ code: 'users/user-not-found' })
  })
})

describe('PATCH /users/:uid', () => {
  it('updates the username and avatar of the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: 'New name', avatar: 'https://wrkload.test/new.png' })

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(response.body).toEqual({
      status: 'ok',
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: 'New name',
        avatar: 'https://wrkload.test/new.png',
        role: ROLE_PARTNER
      }
    })
  })

  it.each([
    [{ username: '' }, 'username'],
    [{ avatar: 'not a url' }, 'avatar']
  ])('validates %o', async (changes, path) => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send(changes)

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(validationErrorPaths(response)).toEqual([path])
  })

  it('rejects an update without fields', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({})

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(body(response)).toMatchObject({ code: 'request/nothing-to-update' })
  })

  it.each([{ password: 'new-password' }, { role: ROLE_ADMIN }])(
    'rejects changing %o',
    async (changes) => {
      const { user, authorization } = await createUserWithToken()

      const response = await request(app)
        .patch(`${API.users}/${user._id.toString()}`)
        .set('Authorization', authorization)
        .send({ username: 'New name', ...changes })

      expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
      expect(body(response)).toMatchObject({ code: 'users/permission-denied' })
      expect((await User.findById(user._id))?.role).toBe(ROLE_PARTNER)
    }
  )

  it('updates only the avatar', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ avatar: 'https://wrkload.test/new.png' })

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      user: { username: user.username, avatar: 'https://wrkload.test/new.png' }
    })
  })

  it('rejects changing the email or the confirmation', async () => {
    const { user, authorization } = await createUserWithToken({
      confirmed: false
    })

    const response = await request(app)
      .patch(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)
      .send({ email: 'stolen@wrkload.test', confirmationStatus: true })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'users/permission-denied' })

    const updated = await User.findById(user._id)
    expect(updated?.email).toBe(user.email)
    expect(updated?.confirmationStatus).toBe(false)
  })

  it('rejects another user for a partner', async () => {
    const { authorization } = await createUserWithToken()
    const other = await createUser()

    const response = await request(app)
      .patch(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: 'New name' })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'users/permission-denied' })
  })

  it('lets an admin update another user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    const other = await createUser()

    const response = await request(app)
      .patch(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)
      .send({ username: 'New name' })

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      status: 'ok',
      user: { username: 'New name' }
    })
    expect((await User.findById(other._id))?.username).toBe('New name')
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLE_TRIAL
    })

    const response = await request(app)
      .patch(`${API.users}/${TRIAL_ACCOUNT_ID}`)
      .set('Authorization', authorization)
      .send({ username: 'New name' })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
  })
})

describe('DELETE /users/:uid', () => {
  it('deletes the user with their projects and tasks', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    const other = await createUser()
    await createProject(other._id)
    await createTask(other._id)

    const response = await request(app)
      .delete(`${API.users}/${other._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(await User.findById(other._id)).toBeNull()
    expect(await Project.countDocuments({ authorId: other._id })).toBe(
      NO_DOCUMENTS
    )
    expect(await Task.countDocuments({ authorId: other._id })).toBe(
      NO_DOCUMENTS
    )
  })

  it('lets a user delete their own account', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .delete(`${API.users}/${user._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(await User.findById(user._id)).toBeNull()
  })

  it.each([ROLE_PARTNER, ROLE_TRIAL])(
    'rejects role %i deleting another user',
    async (role) => {
      const { authorization } = await createUserWithToken({ role })
      const other = await createUser()

      const response = await request(app)
        .delete(`${API.users}/${other._id.toString()}`)
        .set('Authorization', authorization)

      expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
      expect(body(response)).toMatchObject({ code: 'users/permission-denied' })
      expect(await User.findById(other._id)).not.toBeNull()
    }
  )

  it('does not delete the trial account', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLE_TRIAL })

    const response = await request(app)
      .delete(`${API.users}/${TRIAL_ACCOUNT_ID}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
  })

  it('returns 403 for a missing user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })

    const response = await request(app)
      .delete(`${API.users}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/user-not-found' })
  })
})
