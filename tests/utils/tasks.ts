import type mongoose from 'mongoose'
import { Project } from '../../src/models/Project.ts'
import { Task } from '../../src/models/Task.ts'

interface CreateTaskOptions {
  title?: string
  project?: string
  timing?: string
  deliveredAt?: string
}

export const createTask = async (
  authorId: mongoose.Types.ObjectId,
  options: CreateTaskOptions = {}
) =>
  await new Task({
    title: options.title ?? 'Task',
    authorId,
    createdAt: '2026-01-01T00:00:00-03:00',
    project: options.project ?? 'Web',
    timing: options.timing ?? '01:00',
    deliveredAt: options.deliveredAt ?? '2026-01-01',
    description: 'Description'
  }).save()

export const createProject = async (
  authorId: mongoose.Types.ObjectId,
  name = 'Web'
) =>
  await new Project({
    name,
    authorId,
    createdAt: '2026-01-01T00:00:00-03:00'
  }).save()
