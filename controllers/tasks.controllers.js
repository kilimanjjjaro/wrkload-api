import dayjs from "dayjs";
import { type } from "os";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { getCurrentMonthTasks, getPastMonthTasks, getTotalTasksTiming, isBetterPerformance } from "../utils/stats.js";

export const getTasks = async (req, res, next) => {
  try {
    let tasks = [];
    const page = req.query.page;
    const limit = req.query.limit;
    const project = req.query.project;
    let projectStats = null;
    let totalTimingPastMonth = '';
    let totalTimingCurrentMonth = '';
    let performance = ''

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    );

    const paginationOptions = {
      select:
        "title authorId createdAt updatedAt project timing deliveredAt description",
      page: page,
      limit: limit,
    };

    tasks = await Task.paginate({ authorId: req.uid, project }, paginationOptions);

    if (tasks.docs.length < 1) {
      return res.status(200).json({
        status: "ok",
        pagination: null,
        tasks: [],
        projectStats: null,
      });
    }

    const pastMonthTasks = getPastMonthTasks(tasks.docs)

    if (pastMonthTasks.length >= 1) {
      totalTimingPastMonth = getTotalTasksTiming(pastMonthTasks);

      projectStats = {
        ...projectStats,
        totalTimingPastMonth: totalTimingPastMonth,
        totalTasksPastMonth: pastMonthTasks.length.toString(),
      };
    }

    const currentMonthTasks = getCurrentMonthTasks(tasks.docs)

    if (currentMonthTasks.length >= 1) {
      totalTimingCurrentMonth = getTotalTasksTiming(currentMonthTasks);

      projectStats = {
        ...projectStats,
        totalTimingCurrentMonth: totalTimingCurrentMonth,
        totalTasksCurrentMonth: currentMonthTasks.length.toString(),
      };
    }

    if (isBetterPerformance(currentMonthTasks, pastMonthTasks)) {
      performance = 'better'
    } else {
      performance = 'worst'
    }

    tasks = {
      status: "ok",
      pagination: {
        totalResults: tasks.totalDocs,
        resultsPerPage: tasks.limit,
        prevPage: tasks.prevPage,
        page: tasks.page,
        nextPage: tasks.nextPage,
      },
      tasks: tasks.docs,
      projectStats: {
        ...projectStats,
        performance
      }
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
      task: {
        _id: task._id,
        title: task.title,
        authorId: task.authorId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        project: task.project,
        timing: task.timing,
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
    const { title, project, timing, deliveredAt, description } =
      req.body;

    const task = new Task({
      title,
      authorId: req.uid,
      createdAt: dayjs().format(),
      project,
      timing,
      deliveredAt: dayjs(deliveredAt).format(),
      description,
    });

    const newTask = await task.save();

    res.status(201).json({ status: "ok", newTask });
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

    reqTask.updatedAt = dayjs().format();

    const updatedTask = await Task.findOneAndUpdate({ _id: id }, reqTask, {
      new: true,
    });

    res.status(200).json({ status: "ok", updatedTask });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
