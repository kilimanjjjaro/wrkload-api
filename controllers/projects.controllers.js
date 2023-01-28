import dayjs from "dayjs";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

export const getProjects = async (req, res, next) => {
  try {
    let projects;
    const page = req.query.page;
    const limit = req.query.limit;

    await User.findOneAndUpdate(
      { _id: req.uid },
      { lastActiveAt: dayjs().format() }
    );

    const paginationOptions = {
      select: "name authorId createdAt totalTasks",
      page: page,
      limit: limit,
    };

    projects = await Project.paginate({ authorId: req.uid }, paginationOptions);

    if (projects.docs.length < 1)
      return res.status(200).json({
        status: "ok",
        pagination: null,
        projects: [],
      });

    projects.docs.forEach(project => {
      Task.find({ project: project.name, authorId: req.uid }, (err, tasks) => {
        if (err) console.error(err);
        project.totalTasks = tasks.length;
        project.save();
      });
    });

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
    console.log(req)

    const exists = Project.find({ name });

    if (exists) throw new Error("Project already exists");

    const project = new Project({
      name,
      authorId: req.uid,
      createdAt: dayjs().format(),
      totalTasks: 0,
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
    const project = await Project.findById(id);

    if (!project) throw new Error("Project not found");

    if (!project.authorId.equals(req.uid))
      throw new Error("Can't delete other authors projects");

    await project.remove();

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
