import { User } from "../models/User.js";

export const getUsers = async (req, res, next) => {
  try {
    if (req.role !== 1) throw new Error("Permission denied");

    const page = req.query.page;
    const limit = req.query.limit;

    const paginationOptions = {
      select:
        "username role registeredAt lastActiveAt email avatar confirmationToken confirmationStatus",
      page: page,
      limit: limit,
    };

    let users = await User.paginate({}, paginationOptions);

    if (users.docs.length < 1) throw new Error("Users not found");

    users = {
      status: "ok",
      pagination: {
        totalResults: users.totalDocs,
        resultsPerPage: users.limit,
        prevPage: users.prevPage,
        page: users.page,
        nextPage: users.nextPage,
      },
      results: users.docs,
    };

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { uid } = req.params;
    let user = await User.findById(uid);

    if (!user) throw new Error("User doesn't exist");

    if (!user._id.equals(req.uid) && req.role !== 1)
      throw new Error("Permission denied");

    user = {
      status: "ok",
      result: {
        _id: user._id,
        username: user.username,
        role: user.role,
        registeredAt: user.registeredAt,
        lastActiveAt: user.lastActiveAt,
        email: user.email,
        avatar: user.avatar,
        confirmationToken: user.confirmationToken,
        confirmationStatus: user.confirmationStatus,
      },
    };

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.role !== 1) throw new Error("Permission denied");

    const { uid } = req.params;
    const user = await User.findById(uid);

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
    let reqUser;
    const { uid } = req.params;
    const user = await User.findById(uid);

    if (!user) throw new Error("User not found");

    for (const key of Object.keys(req.body)) {
      if (req.body[key]) {
        reqUser = Object.assign({}, reqUser, {
          [key]: req.body[key],
        });
      }
    }

    if (
      !user._id.equals(req.uid) ||
      reqUser.id ||
      reqUser._id ||
      reqUser.password ||
      reqUser.role
    )
      throw new Error("Permission denied");

    const updatedUser = await User.findOneAndUpdate({ _id: id }, reqUser, { new: true });

    res.status(200).json({ status: "ok", result: updatedUser });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
