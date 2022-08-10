import { User } from "../models/User.js";

export const getUsers = async (req, res, next) => {
  try {
    if (req.role !== 1) throw new Error("Permission denied");

    const users = await User.find();

    if (users.length < 1) throw new Error("Users not found");

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) throw new Error("User not found");

    if (!user._id.equals(req.uid) && req.role !== 1)
      throw new Error("Permission denied");

    if (req.role === 1) {
      return res.json(user);
    } else {
      const public_user = {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      };

      return res.status(200).json(public_user);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.role !== 1) throw new Error("Permission denied");

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) throw new Error("User not found");

    await user.remove();

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const reqUser = req.body;
    const { id } = req.params;
    let user = await User.findById(id);

    if (!user) throw new Error("User not found");

    if (!user._id.equals(req.uid) || reqUser.id || reqUser._id)
      throw new Error("Permission denied");

    if (req.role !== 1) {
      if (reqUser.role) {
        throw new Error("Permission denied");
      }
    }

    await user.updateOne(reqUser);

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
