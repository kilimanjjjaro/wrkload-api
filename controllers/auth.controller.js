import "dotenv/config";
import jwt from "jsonwebtoken";
import transporter from "../helpers/transporter.js";
import { User } from "../models/User.js";
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator,
} from "../helpers/tokenManager.js";

export const register = async (req, res, next) => {
  try {
    const { username, role, email, avatar, password } = req.body;
    let user = await User.findOne({ email });

    if (user) throw new Error("User already exists");

    user = new User({
      username: username,
      role: role,
      email: email,
      avatar: avatar,
      password: password,
      confirmation_token: confirmationTokenGenerator(email),
    });

    await user.save();

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: `<a href="http://localhost:5000/api/v1/auth/confirm-account/${user.confirmation_token}">Click to confirm account</a>`,
    });

    const { access_token, expiresIn } = tokenGenerator(user._id, user.role);
    refreshTokenGenerator(user._id, user.role, res);

    res.status(201).json({ access_token, expiresIn });
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

    if (!user.confirmation_status) throw new Error("Account not confirmed");

    const reqPass = await user.comparePassword(password);

    if (!reqPass) throw new Error("Wrong password");

    const { access_token, expiresIn } = tokenGenerator(user._id, user.role);
    refreshTokenGenerator(user._id, user.role, res);

    res.status(200).json({ access_token, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshAccessToken = (req, res, next) => {
  try {
    const { access_token, expiresIn } = tokenGenerator(
      req.user._id,
      req.user.role
    );

    res.status(201).json({ access_token, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("refresh_token");
  res.status(200).json({ status: "ok" });
};

export const confirmAccount = async (req, res, next) => {
  try {
    const { confirmation_token } = req.params;

    let user = await User.findOne({ confirmation_token });

    if (!user) throw new Error("Account already confirmed");

    const { email } = jwt.verify(
      confirmation_token,
      process.env.CONFIRMATION_ACCOUNT_KEY
    );

    if (email !== user.email) throw new Error("Invalid token");

    user.confirmation_status = true;
    user.confirmation_token = null;

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

    if (user.confirmation_status) throw new Error("Account already confirmed");

    user.confirmation_token = confirmationTokenGenerator(email);

    await user.save();

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: `<a href="http://localhost:5000/api/v1/auth/confirm-account/${user.confirmation_token}">Click to confirm account</a>`,
    });

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { email, old_password, new_password } = req.body;

    if (!(email, old_password, new_password)) throw new Error("Empty fields");

    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found");

    let reqPass = await user.comparePassword(old_password);

    if (!reqPass) throw new Error("Wrong password");

    reqPass = await user.comparePassword(new_password);

    if (reqPass) throw new Error("Same new password");

    user.password = new_password;

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

    const { reset_password_token } = resetPassTokenGenerator(
      user._id,
      user.password
    );

    await transporter.sendMail({
      from: '"Kilimanjjjaro" <noreply@kilimanjjjaro.com>',
      to: user.email,
      subject: "Reset your password",
      html: `<a href="http://localhost:5000/api/v1/auth/reset-password/${user._id}/${reset_password_token}">Click to reset your password</a>`,
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { uid, reset_password_token } = req.params;
    const { new_password } = req.body;

    if (!(uid, reset_password_token)) throw new Error("Invalid reset link");
    if (!new_password) throw new Error("New password is required");

    let user = await User.findOne({ _id: uid });

    if (!user) throw new Error("User not found");

    let token = process.env.RESET_PASSWORD_KEY + user.password;

    const { uid: id } = jwt.verify(reset_password_token, token);

    if (!user._id.equals(id)) throw new Error("Invalid token");

    user.password = new_password;

    await user.save();

    res.status(201).json({ status: "ok" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
