import dayjs from "dayjs";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { getCurrentMonthTasks, getPastMonthTasks, getTotalTasksTiming, isPerformanceBetter } from "../utils/stats.js";

export const capitalize = (string) => {
  const words = string.split(' ')
  const capitalizedWords = words.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
  return capitalizedWords.join(' ')
}

export const getTasks = async (req, res, next) => {
  try {
    let tasks = [];
    let paginationOptions = {};
    const page = req.query.page;
    const limit = req.query.limit;
    const project = capitalize(req.query.project);
    const search = req.query.search;
    let stats = null;
    let totalPastMonthTiming = 0;
    let totalCurrentMonthTiming = 0;

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    );

    if (limit) {
      paginationOptions = {
        select:
          "title authorId createdAt updatedAt project timing deliveredAt description",
        page: page,
        limit: limit,
      };
    } else {
      paginationOptions = {
        select:
          "title authorId createdAt updatedAt project timing deliveredAt description",
        pagination: false,
      };
    }

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '');
      tasks = await Task.paginate({ authorId: req.uid, project, title: { "$regex": escapedString, "$options": "i" } }, paginationOptions);
    } else {
      tasks = await Task.paginate({ authorId: req.uid, project }, paginationOptions);
    }

    if (tasks.docs.length < 1) {
      return res.status(200).json({
        status: "ok",
        pagination: null,
        tasks: [],
        stats: null,
      });
    }

    const tasksForStats = await Task.paginate({ authorId: req.uid, project }, {
      select: "deliveredAt timing",
      pagination: false,
    });

    const pastMonthTasks = getPastMonthTasks(tasksForStats.docs)

    if (pastMonthTasks.length >= 1) {
      totalPastMonthTiming = getTotalTasksTiming(pastMonthTasks);
      stats = {
        ...stats,
        totalPastMonthTiming: totalPastMonthTiming,
        totalTasksPastMonth: pastMonthTasks.length,
      };
    } else {
      stats = {
        ...stats,
        totalPastMonthTiming: 0,
        totalTasksPastMonth: 0,
      };
    }

    const currentMonthTasks = getCurrentMonthTasks(tasksForStats.docs)

    if (currentMonthTasks.length >= 1) {
      totalCurrentMonthTiming = getTotalTasksTiming(currentMonthTasks);
      stats = {
        ...stats,
        totalCurrentMonthTiming: totalCurrentMonthTiming,
        totalTasksCurrentMonth: currentMonthTasks.length,
      };
    } else {
      stats = {
        ...stats,
        totalCurrentMonthTiming: 0,
        totalTasksCurrentMonth: 0,
      };
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
      stats: {
        ...stats,
        performance: isPerformanceBetter(totalCurrentMonthTiming, totalPastMonthTiming)
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

    if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");

    const task = new Task({
      title,
      authorId: req.uid,
      createdAt: dayjs().format(),
      project,
      timing,
      deliveredAt: dayjs(deliveredAt).format('YYYY-MM-DD'),
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
    
    if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");

    const task = await Task.findOneAndDelete({ _id: id, authorId: req.uid });

    if (!task) throw new Error("Task not found");

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

    if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");

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
