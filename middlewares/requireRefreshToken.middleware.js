import jwt from "jsonwebtoken";

// MAKE A MIDDLEWARE TO REQUIRE A REFRESH TOKEN.
export const requireRefreshToken = (req, res, next) => {
  console.log('cookies: ', req.cookies)
  
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new Error("Token not found");

    const { uid, role, email } = jwt.verify(refreshToken, process.env.REFRESH_KEY);

    req.uid = uid;
    req.role = role;
    req.email = email;

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};
