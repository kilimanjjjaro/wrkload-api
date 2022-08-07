import { User } from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    if (req.role !== 1) {
      return res.status(401).send({
        code: "users/permission-denied",
        message: "Permission denied",
      });
    }

    const users = await User.find();

    if (!users) {
      return res.status(404).send({
        code: "users/users-not-found",
        message: "Users not found",
      });
    }

    return res.json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({
        code: "users/task-not-found",
        message: "Task not found",
      });
    }

    if (!user._id.equals(req.uid) && req.role !== 1) {
      return res.status(401).send({
        code: "users/permission-denied",
        message: "Can't read other users data",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "users/id-not-valid",
        message: "User ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.role !== 1) {
      return res.status(401).send({
        code: "users/permission-denied",
        message: "Permission denied",
      });
    }

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({
        code: "users/user-not-found",
        message: "User not found",
      });
    }

    await user.remove();

    return res.status(200).json({ status: "User deleted" });
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "users/id-not-valid",
        message: "User ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const reqUser = req.body;
    const { id } = req.params;
    let user = await User.findById(id);

    if (!user) {
      return res.status(404).send({
        code: "users/user-not-found",
        message: "User not found",
      });
    }

    if (!user._id.equals(req.uid) || reqUser.id || reqUser._id) {
      return res.status(401).send({
        code: "users/permission-denied",
        message: "Can't update ID data",
      });
    }

    if (req.role !== 1) {
      if (reqUser.role) {
        return res.status(401).send({
          code: "users/permission-denied",
          message: "Can't update your role",
        });
      }
    }

    await user.updateOne(reqUser);

    return res.status(200).json({ status: "User updated" });
  } catch (error) {
    console.error(error);

    if (error.kind === "ObjectId") {
      return res.status(403).send({
        code: "users/id-not-valid",
        message: "User ID not valid",
      });
    }

    return res.status(500).send({ error: "Server error" });
  }
};
