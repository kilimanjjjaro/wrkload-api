import dayjs from "dayjs";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { getBestProjectOfPastMonth } from "../utils/stats.js";

export const getProjects = async (req, res, next) => {
  try {
    let projects;
    let projectPaginationOptions;
    const page = req.query.page;
    const limit = req.query.limit;
    const search = req.query.search;

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    );

    if (limit) {
      projectPaginationOptions = {
        select: "name authorId createdAt totalTasks",
        page: page,
        limit: limit,
      };
    } else {
      projectPaginationOptions = {
        select: "name authorId createdAt totalTasks",
        pagination: false,
      };
    }

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '');
      projects = await Project.paginate({ authorId: req.uid, name: { "$regex": escapedString, "$options": "i" } }, projectPaginationOptions);
    } else {
      projects = await Project.paginate({ authorId: req.uid }, projectPaginationOptions);
    }

    if (projects.docs.length < 1)
      return res.status(200).json({
        status: "ok",
        pagination: null,
        projects: [],
      });


    projects.docs.forEach(project => {
      Task.find({ project: project.name, authorId: req.uid }).then(tasks => {
        project.totalTasks = tasks.length;
        project.save();
      });
    });

    const tasksForStats = await Task.paginate({ authorId: req.uid }, {
      select: "project deliveredAt",
      pagination: false,
    });

    const bestProjectOfPastMonth = await getBestProjectOfPastMonth(tasksForStats.docs);

    projects = {
      status: "ok",
      pagination: {
        totalResults: projects.totalDocs,
        resultsPerPage: projects.limit,
        prevPage: projects.prevPage,
        page: projects.page,
        nextPage: projects.nextPage,
      },
      projects: projects.docs,
      stats: {
        bestProjectOfPastMonth
      }
    };

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    let project = await Project.findById(id);

    if (!project) throw new Error("Project not found");

    if (req.role !== 1 && !project.authorId.equals(req.uid)) {
      throw new Error("Can't read other authors projects");
    }

    project = {
      status: "ok",
      project: {
        _id: project._id,
        name: project.name,
        authorId: project.authorId,
        createdAt: project.createdAt,
        totalTasks: project.totalTasks,
      },
    };

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const { name } = req.body;

    // if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");

    const exists = await Project.findOne({ name, authorId: req.uid });

    if (exists) throw new Error("Project already exists");

    const project = new Project({
      name,
      authorId: req.uid,
      createdAt: dayjs().format()
    });

    const newProject = await project.save();

    res.status(201).json({ status: "ok", newProject });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");

    const project = await Project.findOneAndDelete({ _id: id, authorId: req.uid });

    if (!project) throw new Error("Project not found");

    await Task.deleteMany({ project: project.name, authorId: req.uid });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    let reqProject;
    const { id } = req.params;

    if (req.uid === '6439b01cf35b6e22570cd842') throw new Error("Trial account detected");
    
    const project = await Project.findById(id);

    if (!project) throw new Error("Project not found");

    if (!project.authorId.equals(req.uid))
      throw new Error("Can't update other authors projects");

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqProject = Object.assign({}, reqProject, {
          [key]: req.body[key],
        });
      }
    }

    if (
      reqProject.authorId ||
      reqProject.id ||
      reqProject._id ||
      reqProject.createdAt
    )
      throw new Error("Can't update this data");

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id },
      reqProject,
      { new: true }
    );

    res.status(200).json({ status: "ok", updatedProject });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
