import jwt from "jsonwebtoken";

export const tokenGenerator = (_id, role) => {
  const expiresIn = 60 * 15;

  try {
    const accessToken = jwt.sign({ _id, role }, process.env.ACCESS_KEY, {
      expiresIn,
    });
    return { accessToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};

export const refreshTokenGenerator = (_id, role, res) => {
  const expiresIn = 60 * 60 * 24 * 30;

  try {
    const refreshToken = jwt.sign({ _id, role }, process.env.REFRESH_KEY, {
      expiresIn,
    });

    res.cookie("refreshToken", refreshToken, {
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

export const resetPassTokenGenerator = (_id, password) => {
  const expiresIn = 60 * 15;
  let token = process.env.RESET_PASSWORD_KEY + password;

  try {
    const resetPasswordToken = jwt.sign({ _id }, token, {
      expiresIn,
    });
    return { resetPasswordToken, expiresIn };
  } catch (error) {
    console.error(error);
  }
};
