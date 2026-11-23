import dayjs from 'dayjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../app.js'
import { Task } from '../../models/Task.js'
import { User } from '../../models/User.js'
import { API, ROLES, TRIAL_ACCOUNT_ID } from '../constants/api.ts'
import { createTask } from '../utils/tasks.ts'
import { createUserWithToken, signAccessToken } from '../utils/users.ts'

const taskBody = {
  title: 'Landing page',
  project: 'Web',
  timing: '02:30',
  deliveredAt: '2026-11-20T10:00:00.000Z',
  description: 'Hero & footer'
}

describe('access token', () => {
  it('rejects a request without the authorization header', async () => {
    const response = await request(app).get(`${API.tasks}?project=web`)

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      status: 'error',
      code: 'token/token-not-found',
      message: 'Token not found'
    })
  })

  it('rejects a malformed token', async () => {
    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', 'Bearer not-a-jwt')

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/invalid-token-format')
  })

  it('rejects a token signed with another key', async () => {
    const token = jwt.sign({ uid: 'x' }, 'another-key')

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/invalid-signature')
  })

  it('rejects an expired token', async () => {
    const token = signAccessToken(
      { _id: 'x', role: ROLES.partner, email: 'kili@wrkload.test' },
      { expiresIn: -1 }
    )

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/token-expired')
  })
})

describe('POST /tasks', () => {
  it('creates a task for the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send(taskBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      status: 'ok',
      newTask: {
        _id: expect.any(String),
        __v: 0,
        title: 'Landing page',
        authorId: user._id.toString(),
        createdAt: expect.any(String),
        updatedAt: '',
        project: 'Web',
        timing: '02:30',
        deliveredAt: '2026-11-20',
        description: 'Hero &amp; footer'
      }
    })
    expect(await Task.countDocuments({ authorId: user._id })).toBe(1)
  })

  it('validates the fields', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send({ ...taskBody, title: ' ', deliveredAt: 'yesterday' })

    expect(response.status).toBe(400)
    expect(
      response.body.error.map((error: { path: string }) => error.path)
    ).toEqual(['title', 'deliveredAt'])
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLES.trial
    })

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send(taskBody)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
    expect(await Task.countDocuments()).toBe(0)
  })
})

describe('GET /tasks', () => {
  it('lists the tasks of a project with the monthly stats', async () => {
    const { user, authorization } = await createUserWithToken()
    const today = dayjs().format('YYYY-MM-DD')
    const pastMonth = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
    await createTask(user._id, { timing: '02:30', deliveredAt: today })
    await createTask(user._id, { timing: '01:45', deliveredAt: today })
    await createTask(user._id, { timing: '01:00', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'Other' })
    await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.tasks).toHaveLength(3)
    expect(response.body.pagination).toEqual({
      totalResults: 3,
      resultsPerPage: 3,
      prevPage: null,
      page: 1,
      nextPage: null
    })
    expect(response.body.stats).toEqual({
      totalPastMonthTiming: 1,
      totalTasksPastMonth: 1,
      totalCurrentMonthTiming: 4,
      totalTasksCurrentMonth: 2,
      performance: 'better'
    })

    const updated = await User.findById(user._id)
    expect(updated?.lastActiveAt).not.toBe('')
  })

  it('trims and capitalizes the project query', async () => {
    const { user, authorization } = await createUserWithToken()
    await createTask(user._id, { project: 'Web' })

    const response = await request(app)
      .get(API.tasks)
      .query({ project: '  web  ' })
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body.tasks).toHaveLength(1)
  })

  it('paginates the tasks', async () => {
    const { user, authorization } = await createUserWithToken()
    for (let index = 0; index < 5; index++) await createTask(user._id)

    const response = await request(app)
      .get(`${API.tasks}?project=web&page=2&limit=2`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body.tasks).toHaveLength(2)
    expect(response.body.pagination).toEqual({
      totalResults: 5,
      resultsPerPage: 2,
      prevPage: 1,
      page: 2,
      nextPage: 3
    })
  })

  it('searches the tasks by title ignoring case', async () => {
    const { user, authorization } = await createUserWithToken()
    await createTask(user._id, { title: 'Landing page' })
    await createTask(user._id, { title: 'Checkout' })

    const response = await request(app)
      .get(`${API.tasks}?project=web&search="LANDING"`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(
      response.body.tasks.map((task: { title: string }) => task.title)
    ).toEqual(['Landing page'])
  })

  it.fails(
    'searches the title as text, not as a regular expression',
    async () => {
      const { user, authorization } = await createUserWithToken()
      await createTask(user._id, { title: 'Landing page' })

      const response = await request(app)
        .get(API.tasks)
        .query({ project: 'web', search: 'L.nding' })
        .set('Authorization', authorization)

      expect(response.status).toBe(200)
      expect(response.body.tasks).toEqual([])
    }
  )

  it('returns an empty list without stats', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      pagination: null,
      tasks: [],
      stats: null
    })
  })

  it('requires the project query', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(API.tasks)
      .set('Authorization', authorization)

    expect(response.status).toBe(400)
    expect(response.body.error[0].path).toBe('project')
  })
})

describe('GET /tasks/:id', () => {
  it('returns a task of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      task: {
        _id: task._id.toString(),
        title: task.title,
        authorId: user._id.toString(),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        project: task.project,
        timing: task.timing,
        deliveredAt: task.deliveredAt,
        description: task.description
      }
    })
  })

  it('rejects a task of another user', async () => {
    const { authorization } = await createUserWithToken()
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('tasks/permission-denied')
  })

  it('lets an admin read a task of another user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLES.admin })
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
  })

  it('returns 404 for a missing task', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('tasks/task-not-found')
  })

  it.fails('rejects an invalid id', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}/not-an-id`)
      .set('Authorization', authorization)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/id-not-valid')
  })
})

describe('PATCH /tasks/:id', () => {
  it('updates a task of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send({ ...taskBody, title: 'New title' })

    expect(response.status).toBe(200)
    expect(response.body.updatedTask).toMatchObject({
      _id: task._id.toString(),
      title: 'New title',
      timing: '02:30'
    })
    expect(response.body.updatedTask.updatedAt).not.toBe('')
    expect((await Task.findById(task._id))?.title).toBe('New title')
  })

  it('rejects changing the author', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send({ ...taskBody, authorId: new mongoose.Types.ObjectId() })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('tasks/permission-denied')
  })

  it.fails('rejects changing the author with an update operator', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)
    const otherId = new mongoose.Types.ObjectId()

    await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send({ ...taskBody, $set: { authorId: otherId } })

    expect((await Task.findById(task._id))?.authorId.toString()).toBe(
      user._id.toString()
    )
  })

  it('rejects a task of another user', async () => {
    const { authorization } = await createUserWithToken()
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send(taskBody)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('tasks/permission-denied')
  })
})

describe('DELETE /tasks/:id', () => {
  it('deletes a task of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .delete(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(await Task.countDocuments()).toBe(0)
  })

  it('does not delete a task of another user', async () => {
    const { authorization } = await createUserWithToken()
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .delete(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('tasks/task-not-found')
    expect(await Task.countDocuments()).toBe(1)
  })
})
