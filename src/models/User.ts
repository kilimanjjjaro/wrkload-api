import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import mongoosePaginate from 'mongoose-paginate-v2'
import { PASSWORD_SALT_ROUNDS } from '../constants/index.ts'
import { logError } from '../utils/logger.ts'

interface UserMethods {
  comparePassword: (candidatePassword: string) => Promise<boolean>
}

const userSchemaDefinition = {
  username: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: Number,
    required: true,
    trim: true
  },
  registeredAt: {
    type: String,
    require: true
  },
  lastActiveAt: {
    type: String,
    require: true,
    default: ''
  },
  recentlyActive: {
    type: Boolean,
    require: true,
    default: false
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  avatar: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  confirmationToken: {
    type: String,
    default: null
  },
  confirmationStatus: {
    type: Boolean,
    default: false
  }
} as const

type UserSchema = mongoose.InferRawDocType<typeof userSchemaDefinition>

type UserModel = mongoose.PaginateModel<UserSchema, object, UserMethods>

const userSchema = new mongoose.Schema<UserSchema, UserModel, UserMethods>(
  userSchemaDefinition
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  try {
    const salt = await bcryptjs.genSalt(PASSWORD_SALT_ROUNDS)
    this.password = await bcryptjs.hash(this.password, salt)
  } catch (error) {
    logError(error)
    throw new Error('Hash password failed', { cause: error })
  }
})

userSchema.plugin(mongoosePaginate)

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcryptjs.compare(candidatePassword, this.password)
}

export const User = mongoose.model<UserSchema, UserModel>('User', userSchema)
