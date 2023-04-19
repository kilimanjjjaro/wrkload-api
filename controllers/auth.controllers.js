import "dotenv/config";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import transporter from "../utils/transporter.js";
import { User } from "../models/User.js";
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator,
} from "../utils/tokenManager.js";
import confirmAccountMail from "../templates/confirmAccountMail.js";
import resendConfirmationAccountLinkMail from "../templates/resendConfirmationAccountLinkMail.js";
import rememberPasswordMail from "../templates/rememberPasswordMail.js";

export const register = async (req, res, next) => {
  try {
    const { username, role, email, avatar, password } = req.body;
    let user = await User.findOne({ email });

    if (user) throw new Error("User already exists");

    user = new User({
      username: username,
      role: role,
      registeredAt: dayjs().format(),
      email: email,
      avatar: avatar,
      password: password,
      confirmationToken: confirmationTokenGenerator(email),
      confirmationStatus: false,
    });

    await user.save();

    await transporter.sendMail({
      from: '"wrkload" <wrkload@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: confirmAccountMail(user.confirmationToken),
    });

    res.status(201).json({ status: "ok" });
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

    user.lastActiveAt = dayjs().format();

    await user.save();

    const { accessToken, expiresIn } = tokenGenerator(user._id, user.role, user.email, res);
  
    refreshTokenGenerator(user._id, user.role, user.email, res);

    const secureUser = {
      _id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    };

    res.status(200).json({ status: "ok", user: secureUser, accessToken, expiresIn });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshAccessToken = (req, res, next) => {
  try {
    const { accessToken, expiresIn } = tokenGenerator(req.uid, req.role, req.email, res);

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
      from: '"wrkload" <wrkload@kilimanjjjaro.com>',
      to: user.email,
      subject: "Confirm your account",
      html: resendConfirmationAccountLinkMail(user.confirmationToken),
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

    if (user._id.equals('6439b01cf35b6e22570cd842')) throw new Error("Trial account detected");

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

export const rememberPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) throw new Error("User not found to reset password");

    if (user._id.equals('6439b01cf35b6e22570cd842')) throw new Error("Trial account detected");

    const { resetPasswordToken } = resetPassTokenGenerator(
      user._id,
      user.password
    );

    await transporter.sendMail({
      from: '"wrkload" <wrkload@kilimanjjjaro.com>',
      to: user.email,
      subject: "Reset your password",
      html: rememberPasswordMail({id: user._id, resetPasswordToken}),
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

    if (user._id.equals('6439b01cf35b6e22570cd842')) throw new Error("Trial account detected");

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
