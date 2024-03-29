import jwt from "jsonwebtoken";

export const tokenGenerator = (uid, role, email, res) => {
  const expiresIn = 60 * 15;

  try {
    const accessToken = jwt.sign({ uid, role, email }, process.env.ACCESS_KEY, {
      expiresIn,
    });

    return { accessToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};

export const refreshTokenGenerator = (uid, role, email, res) => {
  const expiresIn = 60 * 60 * 24 * 30;

  try {
    const refreshToken = jwt.sign({ uid, role, email }, process.env.REFRESH_KEY, {
      expiresIn,
    });

    res.cookie("refreshToken", refreshToken, {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + expiresIn * 1000)
    });

    return { refreshToken, expiresIn };
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
