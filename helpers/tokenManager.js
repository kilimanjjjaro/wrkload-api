import jwt from "jsonwebtoken";

// MAKE A HELPER/UTILITY TO GENERATE AN ACCESS TOKEN.
export const tokenGenerator = (uid, role) => {
  const expiresIn = 60 * 15;

  try {
    const access_token = jwt.sign({ uid, role }, process.env.ACCESS_KEY, {
      expiresIn,
    });
    return { access_token, expiresIn };
  } catch (error) {
    console.error(error);
  }
};

// MAKE A HELPER/UTILITY TO GENERATE A REFRESH TOKEN.
export const refreshTokenGenerator = (uid, role, res) => {
  const expiresIn = 60 * 60 * 24 * 30;

  try {
    const refresh_token = jwt.sign({ uid, role }, process.env.REFRESH_KEY, {
      expiresIn,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: !(process.env.MODE === "dev"),
      expires: new Date(Date.now() + expiresIn * 1000),
    });
  } catch (error) {
    console.error(error);
  }
};

export const confirmationTokenGenerator = (email) => {
  const expiresIn = 60 * 15;

  try {
    const access_token = jwt.sign({ email }, process.env.CONFIRMATION_KEY, {
      expiresIn,
    });
    return access_token;
  } catch (error) {
    console.error(error);
  }
};
