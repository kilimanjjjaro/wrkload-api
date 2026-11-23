import dayjs from 'dayjs'
import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import { Project } from '../../src/models/Project.ts'
import { Task } from '../../src/models/Task.ts'
import { createProject, createTask } from '../utils/tasks.ts'
import { createUserWithToken } from '../utils/users.ts'
import {
  API,
  FIRST_PAGE,
  FIRST_VERSION,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  NO_DOCUMENTS,
  NO_TASKS,
  PREVIOUS_MONTH_OFFSET,
  ROLE_TRIAL,
  SECOND_PAGE,
  SINGLE_DOCUMENT,
  TRIAL_ACCOUNT_ID,
  TWO_DOCUMENTS
} from '../constants/api.ts'
import { NEW_PROJECT_SCHEMA, PROJECTS_SCHEMA } from '../constants/schemas.ts'
import { body, parseBody, validationErrorPaths } from '../utils/http.ts'

describe('POST /projects', () => {
  it('creates a project with a capitalized name', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'landing page' })

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    const { newProject } = parseBody(NEW_PROJECT_SCHEMA, response)
    expect(response.body).toEqual({
      status: 'ok',
      newProject: {
        _id: newProject._id,
        __v: FIRST_VERSION,
        name: 'Landing Page',
        authorId: user._id.toString(),
        createdAt: newProject.createdAt,
        totalTasks: NO_TASKS
      }
    })
  })

  it('rejects a project name the user already has', async () => {
    const { user, authorization } = await createUserWithToken()
    await createProject(user._id, 'Web')

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({
      code: 'projects/project-already-exists'
    })
  })

  it('lets another user use the same name', async () => {
    const { authorization } = await createUserWithToken()
    await createProject(new mongoose.Types.ObjectId(), 'Web')

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(HTTP_STATUS_CREATED)
  })

  it('requires the name', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: ' ' })

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    const [firstPath] = validationErrorPaths(response)
    expect(firstPath).toBe('name')
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLE_TRIAL
    })

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
  })
})

describe('GET /projects', () => {
  it('lists the projects of the user with the best project of the past month', async () => {
    const { user, authorization } = await createUserWithToken()
    const pastMonth = dayjs()
      .subtract(PREVIOUS_MONTH_OFFSET, 'month')
      .format('YYYY-MM-DD')
    await createProject(user._id, 'Web')
    await createProject(user._id, 'App')
    await createProject(new mongoose.Types.ObjectId(), 'Other')
    await createTask(user._id, { project: 'Web', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'Web', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'App', deliveredAt: pastMonth })

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(PROJECTS_SCHEMA, response).projects.map(({ name }) => name)
    ).toEqual(['Web', 'App'])
    expect(body(response)).toHaveProperty('pagination', {
      totalResults: TWO_DOCUMENTS,
      resultsPerPage: TWO_DOCUMENTS,
      prevPage: null,
      page: FIRST_PAGE,
      nextPage: null
    })
    expect(body(response)).toHaveProperty('stats', {
      bestProjectOfPastMonth: 'Web'
    })
  })

  it('returns and stores the current total tasks of each project', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')
    await createTask(user._id, { project: 'Web' })
    await createTask(user._id, { project: 'Web' })

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(body(response)).toHaveProperty(
      'projects.0.totalTasks',
      TWO_DOCUMENTS
    )
    expect((await Project.findById(project._id))?.totalTasks).toBe(
      TWO_DOCUMENTS
    )
  })

  it('answers 500 instead of crashing when a count update fails', async () => {
    const { user, authorization } = await createUserWithToken()
    await createProject(user._id, 'Web')
    vi.spyOn(Project.prototype, 'save').mockRejectedValue(
      new Error('write failed')
    )

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR)
  })

  it('paginates and searches the projects', async () => {
    const { user, authorization } = await createUserWithToken()
    await createProject(user._id, 'Web One')
    await createProject(user._id, 'Web Two')
    await createProject(user._id, 'App')

    const response = await request(app)
      .get(`${API.projects}?search="web"&page=2&limit=1`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(
      parseBody(PROJECTS_SCHEMA, response).projects.map(({ name }) => name)
    ).toEqual(['Web Two'])
    expect(body(response)).toMatchObject({
      pagination: {
        totalResults: TWO_DOCUMENTS,
        page: SECOND_PAGE,
        prevPage: FIRST_PAGE,
        nextPage: null
      }
    })
  })

  it('returns an empty list', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(response.body).toEqual({
      status: 'ok',
      pagination: null,
      projects: []
    })
  })
})

describe('GET /projects/:id', () => {
  it('returns a project of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .get(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(response.body).toEqual({
      status: 'ok',
      project: {
        _id: project._id.toString(),
        name: project.name,
        authorId: user._id.toString(),
        createdAt: project.createdAt,
        totalTasks: NO_TASKS
      }
    })
  })

  it('rejects a project of another user', async () => {
    const { authorization } = await createUserWithToken()
    const project = await createProject(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'projects/permission-denied' })
  })

  it('returns 404 for a missing project', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.projects}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND)
    expect(body(response)).toMatchObject({ code: 'projects/project-not-found' })
  })
})

describe('PATCH /projects/:id', () => {
  it('moves the tasks of a renamed project to the new name', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')
    await createTask(user._id, { project: 'Web' })
    await createTask(user._id, { project: 'Web' })
    await createTask(new mongoose.Types.ObjectId(), { project: 'Web' })

    const renameResponse = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'mobile app' })

    expect(renameResponse.status).toBe(HTTP_STATUS_OK)
    expect(body(renameResponse)).toHaveProperty(
      'updatedProject.name',
      'Mobile App'
    )

    const tasksResponse = await request(app)
      .get(API.tasks)
      .query({ project: 'mobile app' })
      .set('Authorization', authorization)

    expect(body(tasksResponse)).toHaveProperty('tasks.length', TWO_DOCUMENTS)
    expect(await Task.countDocuments({ project: 'Web' })).toBe(SINGLE_DOCUMENT)
  })

  it('rejects renaming a project to a name the user already has', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')
    await createProject(user._id, 'App')
    await createTask(user._id, { project: 'Web' })

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'app' })

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({
      code: 'projects/project-already-exists'
    })
    expect(await Task.countDocuments({ project: 'Web' })).toBe(SINGLE_DOCUMENT)
  })

  it('keeps the name when renaming a project to the same name', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toHaveProperty('updatedProject.name', 'Web')
  })

  it('renames a project of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile' })

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(body(response)).toMatchObject({
      updatedProject: {
        _id: project._id.toString(),
        name: 'Mobile'
      }
    })
  })

  it('rejects changing the author', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile', authorId: new mongoose.Types.ObjectId() })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'projects/permission-denied' })
  })

  it('rejects changing the author with an update operator', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({
        name: 'Mobile',
        $set: { authorId: new mongoose.Types.ObjectId() }
      })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect((await Project.findById(project._id))?.authorId?.toString()).toBe(
      user._id.toString()
    )
  })

  it('rejects a project of another user', async () => {
    const { authorization } = await createUserWithToken()
    const project = await createProject(new mongoose.Types.ObjectId())

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile' })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'projects/permission-denied' })
  })
})

describe('DELETE /projects/:id', () => {
  it('deletes a project of the user and its tasks', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')
    await createTask(user._id, { project: 'Web' })
    await createTask(user._id, { project: 'App' })

    const response = await request(app)
      .delete(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(await Project.countDocuments()).toBe(NO_DOCUMENTS)
    expect(
      (await Task.find()).map((task: { project: string }) => task.project)
    ).toEqual(['App'])
  })

  it('does not delete a project of another user', async () => {
    const { authorization } = await createUserWithToken()
    const project = await createProject(new mongoose.Types.ObjectId())

    const response = await request(app)
      .delete(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(HTTP_STATUS_NOT_FOUND)
    expect(await Project.countDocuments()).toBe(SINGLE_DOCUMENT)
  })
})
