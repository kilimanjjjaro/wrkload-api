import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import mongoosePaginate from 'mongoose-paginate-v2'

const userSchema = new mongoose.Schema({
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
})

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  try {
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
  } catch (error) {
    console.error(error)
    throw new Error('Hash password failed')
  }
})

userSchema.plugin(mongoosePaginate)

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password)
}

export const User = mongoose.model('User', userSchema)
