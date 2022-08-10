import jwt from "jsonwebtoken";

// MAKE A MIDDLEWARE TO REQUIRE A ACCESS TOKEN.
export const requireAccessToken = (req, res, next) => {
  try {
    let access_token = req.headers?.authorization;

    if (!access_token) throw new Error("Token not found");

    access_token = access_token.split(" ")[1];

    const { uid, role } = jwt.verify(access_token, process.env.ACCESS_KEY);

    req.uid = uid;
    req.role = role;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
