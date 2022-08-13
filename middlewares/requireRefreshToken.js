import jwt from "jsonwebtoken";

// MAKE A MIDDLEWARE TO REQUIRE A REFRESH TOKEN.
export const requireRefreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new Error("Token not found");

    const { _id, role } = jwt.verify(refreshToken, process.env.REFRESH_KEY);

    req._id = _id;
    req.role = role;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
