import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import mongoosePaginate from "mongoose-paginate-v2";

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
  confirmationToken: {
    type: String,
    default: null,
  },
  confirmationStatus: {
    type: Boolean,
    default: false,
  },
});

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

userSchema.plugin(mongoosePaginate);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
