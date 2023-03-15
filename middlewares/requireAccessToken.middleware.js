import jwt from "jsonwebtoken";

export const requireAccessToken = (req, res, next) => {
  try {
    let accessToken = req.headers?.authorization;

    if (!accessToken) throw new Error("Token not found");

    accessToken = accessToken.split(" ")[1];

    const { uid, role, email } = jwt.verify(accessToken, process.env.ACCESS_KEY);

    req.uid = uid;
    req.role = role;
    req.email = email;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
