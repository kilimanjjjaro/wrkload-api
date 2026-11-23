import dayjs from 'dayjs'
import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../app.js'
import { Project } from '../../models/Project.js'
import { Task } from '../../models/Task.js'
import { API, ROLES, TRIAL_ACCOUNT_ID } from '../constants/api.ts'
import { createProject, createTask } from '../utils/tasks.ts'
import { createUserWithToken } from '../utils/users.ts'

describe('POST /projects', () => {
  it('creates a project with a capitalized name', async () => {
    const { user, authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'landing page' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      status: 'ok',
      newProject: {
        _id: expect.any(String),
        __v: 0,
        name: 'Landing Page',
        authorId: user._id.toString(),
        createdAt: expect.any(String),
        totalTasks: 0
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

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('projects/project-already-exists')
  })

  it('lets another user use the same name', async () => {
    const { authorization } = await createUserWithToken()
    await createProject(new mongoose.Types.ObjectId(), 'Web')

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(201)
  })

  it('requires the name', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: ' ' })

    expect(response.status).toBe(400)
    expect(response.body.error[0].path).toBe('name')
  })

  it('rejects the trial account', async () => {
    const { authorization } = await createUserWithToken({
      _id: TRIAL_ACCOUNT_ID,
      role: ROLES.trial
    })

    const response = await request(app)
      .post(API.projects)
      .set('Authorization', authorization)
      .send({ name: 'web' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
  })
})

describe('GET /projects', () => {
  it('lists the projects of the user with the best project of the past month', async () => {
    const { user, authorization } = await createUserWithToken()
    const pastMonth = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
    await createProject(user._id, 'Web')
    await createProject(user._id, 'App')
    await createProject(new mongoose.Types.ObjectId(), 'Other')
    await createTask(user._id, { project: 'Web', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'Web', deliveredAt: pastMonth })
    await createTask(user._id, { project: 'App', deliveredAt: pastMonth })

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(
      response.body.projects.map((project: { name: string }) => project.name)
    ).toEqual(['Web', 'App'])
    expect(response.body.pagination).toEqual({
      totalResults: 2,
      resultsPerPage: 2,
      prevPage: null,
      page: 1,
      nextPage: null
    })
    expect(response.body.stats).toEqual({ bestProjectOfPastMonth: 'Web' })
  })

  it('updates the total tasks of each project in the background', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id, 'Web')
    await createTask(user._id, { project: 'Web' })
    await createTask(user._id, { project: 'Web' })

    await request(app).get(API.projects).set('Authorization', authorization)

    await vi.waitFor(async () => {
      expect((await Project.findById(project._id))?.totalTasks).toBe(2)
    })
  })

  it('paginates and searches the projects', async () => {
    const { user, authorization } = await createUserWithToken()
    await createProject(user._id, 'Web One')
    await createProject(user._id, 'Web Two')
    await createProject(user._id, 'App')

    const response = await request(app)
      .get(`${API.projects}?search="web"&page=2&limit=1`)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
    expect(
      response.body.projects.map((project: { name: string }) => project.name)
    ).toEqual(['Web Two'])
    expect(response.body.pagination).toMatchObject({
      totalResults: 2,
      page: 2,
      prevPage: 1,
      nextPage: null
    })
  })

  it('returns an empty list', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(API.projects)
      .set('Authorization', authorization)

    expect(response.status).toBe(200)
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

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      project: {
        _id: project._id.toString(),
        name: project.name,
        authorId: user._id.toString(),
        createdAt: project.createdAt,
        totalTasks: 0
      }
    })
  })

  it('rejects a project of another user', async () => {
    const { authorization } = await createUserWithToken()
    const project = await createProject(new mongoose.Types.ObjectId())

    const response = await request(app)
      .get(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('projects/permission-denied')
  })

  it('returns 404 for a missing project', async () => {
    const { authorization } = await createUserWithToken()

    const response = await request(app)
      .get(`${API.projects}/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', authorization)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('projects/project-not-found')
  })
})

describe('PATCH /projects/:id', () => {
  it('renames a project of the user', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile' })

    expect(response.status).toBe(200)
    expect(response.body.updatedProject).toMatchObject({
      _id: project._id.toString(),
      name: 'Mobile'
    })
  })

  it('rejects changing the author', async () => {
    const { user, authorization } = await createUserWithToken()
    const project = await createProject(user._id)

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile', authorId: new mongoose.Types.ObjectId() })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('tasks/permission-denied')
  })

  it('rejects a project of another user', async () => {
    const { authorization } = await createUserWithToken()
    const project = await createProject(new mongoose.Types.ObjectId())

    const response = await request(app)
      .patch(`${API.projects}/${project._id.toString()}`)
      .set('Authorization', authorization)
      .send({ name: 'Mobile' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('projects/permission-denied')
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

    expect(response.status).toBe(200)
    expect(await Project.countDocuments()).toBe(0)
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

    expect(response.status).toBe(404)
    expect(await Project.countDocuments()).toBe(1)
  })
})
