import jwt from "jsonwebtoken";

export const tokenGenerator = (uid, role) => {
  // const expiresIn = 60 * 15;
  const expiresIn = 60;

  try {
    const accessToken = jwt.sign(
      { uid, email, username, role },
      process.env.ACCESS_KEY,
      {
        expiresIn,
      }
    );
    return { accessToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};

export const refreshTokenGenerator = (uid, role, res) => {
  // const expiresIn = 60 * 60 * 24 * 30;
  const expiresIn = 120;

  try {
    const refreshToken = jwt.sign(
      { uid, email, username, role },
      process.env.REFRESH_KEY,
      {
        expiresIn,
      }
    );

    res.cookie("refreshToken", refreshToken, {
      // httpOnly: true,
      // secure: !(process.env.DEV_MODE === "true"),
      // expires: new Date(Date.now() + expiresIn * 1000),
      expires: new Date(Date.now() + expiresIn),
    });
  } catch (error) {
    console.error(error);
  }
};

export const confirmationTokenGenerator = (email) => {
  const expiresIn = 60 * 15;

  try {
    const confirmationToken = jwt.sign(
      { email },
      process.env.CONFIRMATION_ACCOUNT_KEY,
      {
        expiresIn,
      }
    );
    return confirmationToken;
  } catch (error) {
    console.error(error);
  }
};

export const resetPassTokenGenerator = (uid, password) => {
  const expiresIn = 60 * 15;
  let token = process.env.RESET_PASSWORD_KEY + password;

  try {
    const resetPasswordToken = jwt.sign({ uid }, token, {
      expiresIn,
    });
    return { resetPasswordToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};
