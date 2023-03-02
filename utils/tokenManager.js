import jwt from "jsonwebtoken";

export const tokenGenerator = (uid, role, res) => {
  const expiresIn = 60 * 15;

  try {
    const accessToken = jwt.sign({ uid, role }, process.env.ACCESS_KEY, {
      expiresIn,
    });

    res.cookie("accessToken", accessToken, {
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + expiresIn * 1000)
    });

    return { accessToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};

export const refreshTokenGenerator = (uid, role, res) => {
  const expiresIn = 60 * 60 * 24 * 30;

  try {
    const refreshToken = jwt.sign({ uid, role }, process.env.REFRESH_KEY, {
      expiresIn,
    });

    res.cookie("refreshToken", refreshToken, {
      sameSite: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + expiresIn * 1000)
    });
  } catch (error) {
    console.error(error);
  }
};

export const confirmationTokenGenerator = (email) => {
  const expiresIn = 60 * 60 * 24;

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
  const expiresIn = 60 * 60 * 24;
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
