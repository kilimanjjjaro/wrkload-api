import jwt from "jsonwebtoken";

export const requireAccessToken = (req, res, next) => {
  try {
    let accessToken = req.headers?.authorization;

    if (!accessToken) throw new Error("Token not found");

    accessToken = accessToken.split(" ")[1];

    const { uid, role } = jwt.verify(accessToken, process.env.ACCESS_KEY);

    req.uid = uid;
    req.role = role;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
