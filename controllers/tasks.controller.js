import { Task } from "../models/Task.js";

export const getTasks = async (req, res, next) => {
  try {
    let tasks;
    const page = req.query.page;
    const limit = req.query.limit;

    const paginationOptions = {
      select: "title authorId project timing month delivered description",
      page: page,
      limit: limit,
    };

    if (req.role === 1) {
      tasks = await Task.paginate({}, paginationOptions);
    } else {
      tasks = await Task.paginate({ authorId: req._id }, paginationOptions);
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

    if (req.role !== 1 && !task.authorId.equals(req._id)) {
      throw new Error("Can't read other authors tasks");
    }

    task = {
      status: "ok",
      result: {
        _id: task._id,
        title: task.title,
        authorId: task.authorId,
        project: task.project,
        timing: task.timing,
        month: task.month,
        delivered: task.delivered,
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
    const { title, project, timing, month, delivered, description } = req.body;

    const task = new Task({
      title,
      authorId: req._id,
      project,
      timing,
      month,
      delivered,
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

    if (!task) {
      return res.status(404).send({
        code: "tasks/task-not-found",
        message: "Task not found",
      });
    }

    if (!task.authorId.equals(req._id)) {
      return res.status(401).send({
        code: "tasks/permission-denied",
        message: "Can't read other authors tasks",
      });
    }

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

    if (!task.authorId.equals(req._id))
      throw new Error("Can't update other authors tasks");

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqTask = Object.assign({}, reqTask, {
          [key]: req.body[key],
        });
      }
    }

    if (reqTask.authorId || reqTask.id || reqTask._id)
      throw new Error("Can't update ID data");

    await task.updateOne({ $set: reqTask });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
