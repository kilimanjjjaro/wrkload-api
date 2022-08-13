import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// MAKE A SCHEMA FOR TASK DATA.
const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
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
  delivered: {
    type: Date,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

taskSchema.plugin(mongoosePaginate);

export const Task = mongoose.model("Task", taskSchema);
