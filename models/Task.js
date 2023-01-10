import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  createdAt: {
    type: String,
    require: true,
  },
  updatedAt: {
    type: String,
    require: true,
    default: "",
  },
  project: {
    type: String,
    required: true,
    trim: true,
  },
  timing: {
    type: String,
    required: true,
    trim: true,
  },
  month: {
    type: String,
    required: true,
    trim: true,
  },
  deliveredAt: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

taskSchema.plugin(mongoosePaginate);

export const Task = mongoose.model("Task", taskSchema);
