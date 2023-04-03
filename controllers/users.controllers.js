import { User } from "../models/User.js";
import dayjs from "dayjs";

export const getUsers = async (req, res, next) => {
  try {
    if (req.role !== 1) throw new Error("Permission denied");

    let users = {};
    let paginationOptions = {};
    const page = req.query.page;
    const limit = req.query.limit;
    const search = req.query.search;

    if (limit) {
      paginationOptions = {
        select: "username role registeredAt lastActiveAt recentlyActive email avatar confirmationToken confirmationStatus",
        page: page,
        limit: limit,
      };
    } else {
      paginationOptions = {
        select: "username role registeredAt lastActiveAt recentlyActive email avatar confirmationToken confirmationStatus",
        pagination: false,
      };
    }

    if (search) {
      const escapedString = search.replace(/^"|"$/g, '');
      users = await User.paginate({ username: { "$regex": escapedString, "$options": "i" } }, paginationOptions);
    } else {
      users = await User.paginate({}, paginationOptions);
    }

    if (users.docs.length < 1)
      return res.status(200).json({
        status: "ok",
        pagination: null,
        users: [],
      });

    const lastHour = dayjs().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss");

    users.docs.forEach(user => {
      if (user.lastActiveAt > lastHour) {
        user.recentlyActive = true
      } else {
        user.recentlyActive = false
      }
    });

    users = {
      status: "ok",
      pagination: {
        totalResults: users.totalDocs,
        resultsPerPage: users.limit,
        prevPage: users.prevPage,
        page: users.page,
        nextPage: users.nextPage,
      },
      users: users.docs,
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
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        registeredAt: user.registeredAt,
        lastActiveAt: user.lastActiveAt,
        recentlyActive: user.recentlyActive,
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
    const { uid } = req.params;
    const user = await User.findOneAndDelete({ _id: uid });

    if (!user) throw new Error("User not found");

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

    const updatedUser = await User.findOneAndUpdate({ _id: uid }, reqUser, {
      new: true,
    });

    res.status(200).json({ status: "ok", updatedUser });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
