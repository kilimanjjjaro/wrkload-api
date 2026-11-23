import dayjs from 'dayjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import { Task } from '../../src/models/Task.ts'
import { User } from '../../src/models/User.ts'
import { createTask } from '../utils/tasks.ts'
import { createUserWithToken, signAccessToken } from '../utils/users.ts'
import {
  API,
  CURRENT_MONTH_HOURS,
  EXPIRED_TOKEN_EXPIRES_IN,
  FIRST_PAGE,
  FIRST_VERSION,
  FIVE_DOCUMENTS,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  NO_DOCUMENTS,
  PAST_MONTH_HOURS,
  PREVIOUS_MONTH_OFFSET,
  ROLE_ADMIN,
  ROLE_PARTNER,
  ROLE_TRIAL,
  SECOND_PAGE,
  SINGLE_DOCUMENT,
  THIRD_PAGE,
  THREE_DOCUMENTS,
  TRIAL_ACCOUNT_ID,
  TWO_DOCUMENTS
} from '../constants/api.ts'
import {
  NEW_TASK_SCHEMA,
  TASKS_SCHEMA,
  UPDATED_AT_SCHEMA
} from '../constants/schemas.ts'
import { body, parseBody, validationErrorPaths } from '../utils/http.ts'

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

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
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

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/invalid-token-format' })
  })

  it('rejects a token signed with another key', async () => {
    const token = jwt.sign({ uid: 'x' }, 'another-key')

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/invalid-signature' })
  })

  it('rejects an expired token', async () => {
    const token = signAccessToken(
      { _id: 'x', role: ROLE_PARTNER, email: 'kili@wrkload.test' },
      { expiresIn: EXPIRED_TOKEN_EXPIRES_IN }
    )

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/token-expired' })
  })
})

describe('POST /tasks', () => {
  it('creates a task for the user', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send(taskBody)

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    const { newTask } = parseBody(NEW_TASK_SCHEMA, response)
    expect(response.body).toEqual({
      status: 'ok',
      newTask: {
        _id: newTask._id,
        __v: FIRST_VERSION,
        title: 'Landing page',
        authorId: user._id.toString(),
        createdAt: newTask.createdAt,
        updatedAt: '',
        project: 'Web',
        timing: '02:30',
        deliveredAt: '2026-11-20',
        description: 'Hero & footer'
      }
    })
    expect(await Task.countDocuments({ authorId: user._id })).toBe(
      SINGLE_DOCUMENT
    )
  })

  it('stores the text as sent', async () => {
    const { authorization } = await createUserWithToken()

    await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send({
        ...taskBody,
        project: 'R&D "<Team>"',
        title: "Fix <b> & ship it's"
      })

    const response = await request(app)
      .get(API.tasks)
      .query({ project: 'R&D "<Team>"' })
      .set('Authorization', authorization)

    expect(
      parseBody(TASKS_SCHEMA, response).tasks.map(({ title }) => title)
    ).toEqual(["Fix <b> & ship it's"])
  })

  it('validates the fields', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send({ ...taskBody, title: ' ', deliveredAt: 'yesterday' })

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(validationErrorPaths(response)).toEqual(['title', 'deliveredAt'])
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLE_TRIAL
    })

    const response = await request(app)
      .post(API.tasks)
      .set('Authorization', authorization)
      .send(taskBody)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
    expect(await Task.countDocuments()).toBe(NO_DOCUMENTS)
  })
})

describe('GET /tasks', () => {
  it('lists the tasks of a project with the monthly stats', async () => {
    const { user, authorization } = await createUserWithToken()
    const today = dayjs().format('YYYY-MM-DD')
    const pastMonth = dayjs()
      .subtract(PREVIOUS_MONTH_OFFSET, 'month')
      .format('YYYY-MM-DD')
    await createTask(user._id, { timing: '02:30', deliveredAt: today })
    await createTask(user._id, { timing: '01:45', deliveredAt: today })
    await createTask(user._id, { timing: '01:00', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'Other' })
    await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toHaveProperty('status', 'ok')
    expect(body(response)).toHaveProperty('tasks.length', THREE_DOCUMENTS)
    expect(body(response)).toHaveProperty('pagination', {
      totalResults: THREE_DOCUMENTS,
      resultsPerPage: THREE_DOCUMENTS,
      prevPage: null,
      page: FIRST_PAGE,
      nextPage: null
    })
    expect(body(response)).toHaveProperty('stats', {
      totalPastMonthTiming: PAST_MONTH_HOURS,
      totalTasksPastMonth: SINGLE_DOCUMENT,
      totalCurrentMonthTiming: CURRENT_MONTH_HOURS,
      totalTasksCurrentMonth: TWO_DOCUMENTS,
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

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toHaveProperty('tasks.length', SINGLE_DOCUMENT)
  })

  it('paginates the tasks', async () => {
    const { user, authorization } = await createUserWithToken()
    await Promise.all(
      Array.from(
        { length: FIVE_DOCUMENTS },
        async () => await createTask(user._id)
      )
    )

    const response = await request(app)
      .get(`${API.tasks}?project=web&page=2&limit=2`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toHaveProperty('tasks.length', TWO_DOCUMENTS)
    expect(body(response)).toHaveProperty('pagination', {
      totalResults: FIVE_DOCUMENTS,
      resultsPerPage: TWO_DOCUMENTS,
      prevPage: FIRST_PAGE,
      page: SECOND_PAGE,
      nextPage: THIRD_PAGE
    })
  })

  it('searches the tasks by title ignoring case', async () => {
    const { user, authorization } = await createUserWithToken()
    await createTask(user._id, { title: 'Landing page' })
    await createTask(user._id, { title: 'Checkout' })

    const response = await request(app)
      .get(`${API.tasks}?project=web&search="LANDING"`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(TASKS_SCHEMA, response).tasks.map(({ title }) => title)
    ).toEqual(['Landing page'])
  })

  it('searches the title as text, not as a regular expression', async () => {
    const { user, authorization } = await createUserWithToken()
    await createTask(user._id, { title: 'Landing page' })
    await createTask(user._id, { title: 'Landing (v2)' })

    const regexResponse = await request(app)
      .get(API.tasks)
      .query({ project: 'web', search: 'L.nding' })
      .set('Authorization', authorization)

    expect(regexResponse.status).toBe(HTTP_STATUS_OK)
    expect(body(regexResponse)).toHaveProperty('tasks', [])

    const textResponse = await request(app)
      .get(API.tasks)
      .query({ project: 'web', search: '(v2' })
      .set('Authorization', authorization)

    expect(textResponse.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(TASKS_SCHEMA, textResponse).tasks.map(({ title }) => title)
    ).toEqual(['Landing (v2)'])
  })

  it('returns an empty list without stats', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}?project=web`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
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

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    const [firstPath] = validationErrorPaths(response)
    expect(firstPath).toBe('project')
  })
})

describe('GET /tasks/:id', () => {
  it('returns a task of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
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

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'tasks/permission-denied' })
  })

  it('lets an admin read a task of another user', async () => {
    const { authorization } = await createUserWithToken({ role: ROLE_ADMIN })
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
  })

  it('hides the details of unexpected errors', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)
    vi.spyOn(Task, 'findById').mockImplementation(() => {
      throw new Error('database exploded')
    })

    const response = await request(app)
      .get(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR)
    expect(response.body).toEqual({
      status: 'error',
      code: 'server/unhandled-error',
      message: 'Internal server error'
    })
  })

  it('returns 404 for a missing task', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND)
    expect(body(response)).toMatchObject({ code: 'tasks/task-not-found' })
  })

  it('rejects an invalid id', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.tasks}/not-an-id`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/id-not-valid' })
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

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      updatedTask: {
        _id: task._id.toString(),
        title: 'New title',
        timing: '02:30',
        deliveredAt: '2026-11-20'
      }
    })
    expect(
      parseBody(UPDATED_AT_SCHEMA, response).updatedTask.updatedAt
    ).not.toBe('')
    expect((await Task.findById(task._id))?.title).toBe('New title')
  })

  it('rejects changing the author', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send({ ...taskBody, authorId: new mongoose.Types.ObjectId() })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'tasks/permission-denied' })
  })

  it('rejects changing the author with an update operator', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)
    const otherId = new mongoose.Types.ObjectId()

    const response = await request(app)
      .patch(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)
      .send({ ...taskBody, $set: { authorId: otherId } })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'tasks/permission-denied' })
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

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'tasks/permission-denied' })
  })
})

describe('DELETE /tasks/:id', () => {
  it('deletes a task of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const task = await createTask(user._id)

    const response = await request(app)
      .delete(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(await Task.countDocuments()).toBe(NO_DOCUMENTS)
  })

  it('does not delete a task of another user', async () => {
    const { authorization } = await createUserWithToken()
    const task = await createTask(new mongoose.Types.ObjectId())

    const response = await request(app)
      .delete(`${API.tasks}/${task._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND)
    expect(body(response)).toMatchObject({ code: 'tasks/task-not-found' })
    expect(await Task.countDocuments()).toBe(SINGLE_DOCUMENT)
  })
})
