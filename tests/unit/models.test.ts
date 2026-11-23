import { describe, expect, it } from 'vitest'
import { Project } from '../../src/models/Project.ts'
import { Task } from '../../src/models/Task.ts'

describe('models', () => {
  it('requires the author of a task', async () => {
    const task = new Task({
      title: 'Task',
      project: 'Web',
      timing: '01:00',
      createdAt: '2026-01-01T00:00:00-03:00'
    })

    await expect(task.validate()).rejects.toThrow('authorId')
  })

  it('requires the author of a project', async () => {
    const project = new Project({
      name: 'Web',
      createdAt: '2026-01-01T00:00:00-03:00'
    })

    await expect(project.validate()).rejects.toThrow('authorId')
  })
})
