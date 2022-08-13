const errorsHandler = (err, req, res, next) => {
  switch (err.message) {
    // TOKENS ERRORS
    case "invalid signature":
      return res.status(401).json({
        status: "error",
        code: "token/invalid-signature",
        message: "Invalid token signature",
      });

    case "jwt expired":
      return res.status(401).json({
        status: "error",
        code: "token/token-expired",
        message: "Token expired",
      });

    case "jwt malformed":
      return res.status(401).json({
        status: "error",
        code: "token/invalid-token-format",
        message: "Invalid bearer token format",
      });

    case "invalid token":
      return res.status(401).json({
        status: "error",
        code: "token/invalid-token",
        message: "Invalid token",
      });

    case "Token not found":
      return res.status(401).json({
        status: "error",
        code: "token/token-not-found",
        message: "Token not found",
      });

    case "Invalid reset link":
      return res.status(401).json({
        status: "error",
        code: "token/token-not-found",
        message: "Invalid reset password link",
      });

    // AUTHORIZATION ERRORS
    case "New password is required":
      return res.status(401).json({
        status: "error",
        code: "auth/password-required",
        message: "New password is required",
      });

    case "User already exists":
      return res.status(403).json({
        status: "error",
        code: "auth/email-already-exists",
        message: "User already exists",
      });

    case "User not found":
      return res.status(403).json({
        status: "error",
        code: "auth/user-not-found",
        message: "Wrong email or password",
      });

    case "Account already confirmed":
      return res.status(401).json({
        status: "error",
        code: "auth/account-already-confirmed",
        message: "This account is already confirmed",
      });

    case "Account not confirmed":
      return res.status(401).json({
        status: "error",
        code: "auth/account-not-confirmed",
        message: "Please check your email to confirm account",
      });

    case "Wrong password":
      return res.status(403).json({
        status: "error",
        code: "auth/invalid-credentials",
        message: "Wrong email or password",
      });

    case "Same new password":
      return res.status(403).json({
        status: "error",
        code: "auth/invalid-credentials",
        message: "Wrong email or password",
      });

    case "User not found to reset password":
      return res.status(403).json({
        status: "error",
        code: "auth/user-not-found",
        message: "Check your email for reset your password",
      });

    case "Empty fields":
      return res.status(403).json({
        status: "error",
        code: "auth/empty-fields",
        message: "All fields are required",
      });

    case err.kind === "ObjectId":
      return res.status(403).json({
        status: "error",
        code: "auth/id-not-valid",
        message: "ID not valid",
      });

    // TASKS ERRORS
    case "Tasks not found":
      return res.status(404).json({
        status: "error",
        code: "tasks/tasks-not-found",
        message: "Tasks not found",
      });

    case "Task not found":
      return res.status(404).json({
        status: "error",
        code: "tasks/task-not-found",
        message: "Task not found",
      });

    case "Can't read other authors tasks":
      return res.status(401).json({
        status: "error",
        code: "tasks/permission-denied",
        message: "Can't read other authors tasks",
      });

    case "Can't update other authors tasks":
      return res.status(401).json({
        status: "error",
        code: "tasks/permission-denied",
        message: "Can't update other authors tasks",
      });

    case "Can't update ID data":
      return res.status(401).json({
        status: "error",
        code: "tasks/permission-denied",
        message: "Can't update ID data",
      });

    // USERS ERRORS
    case "Permission denied":
      return res.status(401).json({
        status: "error",
        code: "users/permission-denied",
        message: "Permission denied",
      });

    case "Users not found":
      return res.status(404).json({
        status: "error",
        code: "users/users-not-found",
        message: "Users not found",
      });

    case "User doesn't exist":
      return res.status(404).json({
        status: "error",
        code: "users/user-not-found",
        message: "This user doesn't exist",
      });

    // UNTRACKED ERRORS
    default:
      return res.status(500).json({
        status: "error",
        code: "server/unhandled-error",
        message: err.message,
      });
  }
};

export default errorsHandler;
