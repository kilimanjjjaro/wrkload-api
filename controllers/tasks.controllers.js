import moment from "moment";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

export const getTasks = async (req, res, next) => {
  try {
    let tasks;
    const page = req.query.page;
    const limit = req.query.limit;

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: moment().format() }
    );

    const paginationOptions = {
      select:
        "title authorId createdAt updatedAt project timing month deliveredAt description",
      page: page,
      limit: limit,
    };

    if (req.role === 1) {
      tasks = await Task.paginate({}, paginationOptions);
    } else {
      tasks = await Task.paginate({ authorId: req.uid }, paginationOptions);
    }

    if (tasks.docs.length < 1) throw new Error("Tasks not found");

    tasks = {
      status: "ok",
      pagination: {
        totalResults: tasks.totalDocs,
        resultsPerPage: tasks.limit,
        prevPage: tasks.prevPage,
        page: tasks.page,
        nextPage: tasks.nextPage,
      },
      results: tasks.docs,
    };

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    let task = await Task.findById(id);

    if (!task) throw new Error("Task not found");

    if (req.role !== 1 && !task.authorId.equals(req.uid)) {
      throw new Error("Can't read other authors tasks");
    }

    task = {
      status: "ok",
      result: {
        _id: task._id,
        title: task.title,
        authorId: task.authorId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        project: task.project,
        timing: task.timing,
        month: task.month,
        deliveredAt: task.deliveredAt,
        description: task.description,
      },
    };

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, project, timing, month, deliveredAt, description } = req.body;

    const task = new Task({
      title,
      authorId: req.uid,
      createdAt: moment().format(),
      project,
      timing,
      month,
      deliveredAt: moment(deliveredAt).format(),
      description,
    });

    await task.save();

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) throw new Error("Task not found");

    if (!task.authorId.equals(req.uid))
      throw new Error("Can't delete other authors tasks");

    await task.remove();

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    let reqTask;
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) throw new Error("Task not found");

    if (!task.authorId.equals(req.uid))
      throw new Error("Can't update other authors tasks");

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqTask = Object.assign({}, reqTask, {
          [key]: req.body[key],
        });
      }
    }

    if (
      reqTask.authorId ||
      reqTask.id ||
      reqTask._id ||
      reqTask.createdAt ||
      reqTask.updatedAt
    )
      throw new Error("Can't update this data");

    reqTask.updatedAt = moment().format();

    await task.updateOne({ $set: reqTask });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
