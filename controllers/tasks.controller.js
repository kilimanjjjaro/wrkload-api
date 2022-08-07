import { Task } from "../models/Task.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ id: req.uid });
    return res.json(tasks);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Server error" });
  }
};

export const getTask = async (req, res) => {
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

    return res.json(task);
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "tasks/id-not-valid",
        message: "Task ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};

export const createTask = async (req, res) => {
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

    return res.status(201).json(task);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Server error" });
  }
};

export const deleteTask = async (req, res) => {
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

    return res.status(200).json({ status: "Task deleted" });
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "tasks/id-not-valid",
        message: "Task ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const reqTask = req.body;
    const { id } = req.params;
    let task = await Task.findById(id);

    if (!task) {
      return res.status(404).send({
        code: "tasks/task-not-found",
        message: "Task not found",
      });
    }

    if (!task.author_id.equals(req.uid)) {
      return res.status(401).send({
        code: "tasks/permission-denied",
        message: "Can't update other authors tasks",
      });
    }

    if (reqTask.author_id || reqTask.id || reqTask._id) {
      return res.status(401).send({
        code: "tasks/permission-denied",
        message: "Can't update ID data",
      });
    }

    await task.updateOne(reqTask);

    return res.status(200).json({ status: "Task updated" });
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "tasks/id-not-valid",
        message: "Task ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};
