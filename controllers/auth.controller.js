import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
import {
  refreshTokenGenerator,
  tokenGenerator,
} from "../helpers/tokenManager.js";

// MAKE A CONTRROLLER TO REGISTRY A USER ON DATABASE AND GENERATE AN ACCESS & REFRESH TOKEN.
export const register = async (req, res) => {
  try {
    const { username, role, email, avatar, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(403).json({
        code: "auth/email-already-exists",
        message: "User already exists",
      });
    }

    user = new User({
      username: username,
      role: role,
      email: email,
      avatar: avatar,
      password: password,
      confirmation_token: uuidv4(),
    });

    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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

    return res.status(500).json({ error: "Server error" });
  }
};

// MAKE A CONTROLLER TO LOGIN AND GENERATE AN ACCESS & REFRESH TOKEN.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        code: "auth/user-not-found",
        message: "Wrong email or password",
      });
    }

    if (!user.confirmation_status) {
      return res.status(401).send({
        code: "auth/account-not-confirmed",
        message: "Please check your email to confirm account",
      });
    }

    const reqPass = await user.comparePassword(password);

    if (!reqPass) {
      return res.status(403).json({
        code: "auth/invalid-password",
        message: "Wrong email or password",
      });
    }

    const { access_token, expiresIn } = tokenGenerator(user._id, user.role);
    refreshTokenGenerator(user._id, user.role, res);

    res.status(201).json({ access_token, expiresIn });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: "Server error" });
  }
};

// CREATE A CONTROLLER TO GET A NEW ACCESS TOKEN FROM AN EXISTING REFRESH TOKEN SENDED FROM requireRefreshToken MIDDLEWARE.
export const refreshAccessToken = (req, res) => {
  try {
    const { access_token, expiresIn } = tokenGenerator(
      req.user._id,
      req.user.role
    );

    return res.json({ access_token, expiresIn });
  } catch (error) {
    console.error(error);

    return res.status(500).send({ error: "Server error" });
  }
};

// CREATE A CONTROLLER TO LOGOUT DELETING THE REFRESH TOKEN.
export const logout = (req, res) => {
  res.clearCookie("refresh_token");
  res.json({ status: "ok" });
};

// MAKE A CONTROLLER TO CONFIRM ACCOUNT.
export const confirmAccount = async (req, res) => {
  try {
    const { confirmation_token } = req.params;
    let user = await User.findOne({ confirmation_token });

    if (!user) throw new Error("Invalid token");

    user.confirmation_status = true;
    user.confirmation_token = null;

    await user.save();

    res.status(200).json({ status: "Account confirmed" });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: "Server error" });
  }
};
