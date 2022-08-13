import { Task } from "../models/Task.js";

export const getTasks = async (req, res, next) => {
  try {
    let tasks;
    const page = req.query.page;
    const limit = req.query.limit;

    const paginationOptions = {
      select: "name author_id project timing month delivered description",
      page: page,
      limit: limit,
    };

    if (req.role === 1) {
      tasks = await Task.paginate({}, paginationOptions);
    } else {
      tasks = await Task.paginate({ author_id: req.uid }, paginationOptions);
    }

    if (tasks.docs.length < 1) throw new Error("Tasks not found");

    tasks = {
      status: "ok",
      pagination: {
        totalResults: tasks.totalDocs,
        resultsPerPage: tasks.limit,
        page: tasks.page,
        prevPage: tasks.prevPage,
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
    const task = await Task.findById(id);

    if (!task) throw new Error("Task not found");

    if (!task.author_id.equals(req.uid))
      throw new Error("Can't read other authors tasks");

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { name, project, timing, month, delivered, description } = req.body;

    const task = new Task({
      name,
      author_id: req.uid,
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

    if (!task.author_id.equals(req.uid)) {
      return res.status(401).send({
        code: "tasks/permission-denied",
        message: "Can't read other authors tasks",
      });
    }

    await task.remove();

    res.status(200).json({ status: "Task deleted" });
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

    if (!task.author_id.equals(req.uid))
      throw new Error("Can't update other authors tasks");

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqTask = Object.assign({}, reqTask, {
          [key]: req.body[key],
        });
      }
    }

    if (reqTask.author_id || reqTask.id || reqTask._id)
      throw new Error("Can't update ID data");

    await task.updateOne({ $set: reqUser });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
