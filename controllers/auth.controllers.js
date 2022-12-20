import "dotenv/config";
import jwt from "jsonwebtoken";
import moment from "moment";
import transporter from "../utils/transporter.js";
import { User } from "../models/User.js";
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator,
} from "../utils/tokenManager.js";

export const register = async (req, res, next) => {
  try {
    const { username, role, email, avatar, password } = req.body;
    let user = await User.findOne({ email });

    if (user) throw new Error("User already exists");

    user = new User({
      username: username,
      role: role,
      registeredAt: moment().format(),
      email: email,
      avatar: avatar,
      password: password,
      confirmationToken: confirmationTokenGenerator(email),
    });

    await user.save();

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: `<a href="${process.env.BACKEND_URL}/api/v1/auth/confirm-account/${user.confirmationToken}">Click to confirm account</a>`,
    });

    const { accessToken, expiresIn } = tokenGenerator(user._id, user.role);
    refreshTokenGenerator(user._id, user.role, res);

    res.status(201).json({ status: "ok", user, accessToken, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found");

    if (!user.confirmationStatus) throw new Error("Account not confirmed");

    const reqPass = await user.comparePassword(password);

    if (!reqPass) throw new Error("Wrong password");

    user.lastActiveAt = moment().format();

    await user.save();

    const { accessToken, expiresIn } = tokenGenerator(user._id, user.role);
    refreshTokenGenerator(user._id, user.role, res);

    res.status(200).json({ status: "ok", user, accessToken, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshAccessToken = (req, res, next) => {
  try {
    const { accessToken, expiresIn } = tokenGenerator(req.uid, req.role);

    res.status(201).json({ status: "ok", accessToken, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ status: "ok" });
};

export const confirmAccount = async (req, res, next) => {
  try {
    const { confirmationToken } = req.params;

    let user = await User.findOne({ confirmationToken });

    if (!user) throw new Error("Account already confirmed");

    const { email } = jwt.verify(
      confirmationToken,
      process.env.CONFIRMATION_ACCOUNT_KEY
    );

    if (email !== user.email) throw new Error("Invalid token");

    user.confirmationStatus = true;
    user.confirmationToken = "";

    await user.save();

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const reSendConfirmAccountLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found");

    if (user.confirmationStatus) throw new Error("Account already confirmed");

    user.confirmationToken = confirmationTokenGenerator(email);

    await user.save();

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: `<a href="${process.env.BACKEND_URL}/api/v1/auth/confirm-account/${user.confirmationToken}">Click to confirm account</a>`,
    });

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!(email, oldPassword, newPassword)) throw new Error("Empty fields");

    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found");

    let reqPass = await user.comparePassword(oldPassword);

    if (!reqPass) throw new Error("Wrong password");

    reqPass = await user.comparePassword(newPassword);

    if (reqPass) throw new Error("Same new password");

    user.password = newPassword;

    await user.save();

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found to reset password");

    const { resetPasswordToken } = resetPassTokenGenerator(
      user._id,
      user.password
    );

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Reset your password",
      html: `<a href="${process.env.FRONTEND_URL}/reset-password/${user._id}/${resetPasswordToken}">Click to reset your password</a>`,
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { uid, resetPasswordToken } = req.params;
    const { newPassword } = req.body;

    if (!(uid, resetPasswordToken)) throw new Error("Invalid reset link");
    if (!newPassword) throw new Error("New password is required");

    let user = await User.findOne({ _id: uid });

    if (!user) throw new Error("User not found");

    let token = process.env.RESET_PASSWORD_KEY + user.password;

    const { uid: id } = jwt.verify(resetPasswordToken, token);

    if (!user._id.equals(id)) throw new Error("Invalid token");

    user.password = newPassword;

    await user.save();

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
