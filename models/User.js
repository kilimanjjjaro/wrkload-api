import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

// MAKE A SCHEMA FOR USER DATA.
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: Number,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: { unique: true },
  },
  avatar: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmation_token: {
    type: String,
    default: null,
  },
  confirmation_status: {
    type: Boolean,
    default: false,
  },
});

// MAKE A PRE STEP TO ENCRYPT USER PASSWORD BEFORE SAVE DATA.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    console.error(error);
    throw new Error("Hash password failed");
  }
});

// MAKE A METHOD TO VALIDATE PASSWORD SENDEND BY USER ON LOGIN WITH PASSWORD SAVED ON DATABASE.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
