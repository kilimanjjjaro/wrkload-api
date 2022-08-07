import jwt from "jsonwebtoken";
import { tokenErrors } from "../helpers/tokenManager.js";

// MAKE A MIDDLEWARE TO REQUIRE A REFRESH TOKEN.
export const requireRefreshToken = (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) throw new Error("Token not found");

    const { uid, role } = jwt.verify(refresh_token, process.env.REFRESH_KEY);

    req.uid = uid;
    req.role = role;

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).send({ error: tokenErrors[error.message] });
  }
};
