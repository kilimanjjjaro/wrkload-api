import jwt from "jsonwebtoken";

export const requireAccessToken = (req, res, next) => {
  try {
    let accessToken = req.headers?.authorization;

    if (!accessToken) throw new Error("Token not found");

    accessToken = accessToken.split(" ")[1];

    const { _id, role } = jwt.verify(accessToken, process.env.ACCESS_KEY);

    req._id = _id;
    req.role = role;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
