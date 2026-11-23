import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { NO_TASKS } from '../constants/index.ts'

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  },
  createdAt: {
    type: String,
    require: true,
    default: ''
  },
  totalTasks: {
    type: Number,
    require: true,
    default: NO_TASKS
  }
})

projectSchema.plugin(mongoosePaginate)

type ProjectSchema = mongoose.InferSchemaType<typeof projectSchema>

export const Project = mongoose.model<
  ProjectSchema,
  mongoose.PaginateModel<ProjectSchema>
>('Project', projectSchema)
