import { check, param, validationResult } from "express-validator";

export const manageValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  next();
};

export const registryDataValidations = [
  check("username")
    .trim()
    .notEmpty()
    .withMessage("Username are required")
    .escape()
    .withMessage("Invalid username format"),
  check("role")
    .trim()
    .notEmpty()
    .withMessage("Role are required")
    .bail()
    .isNumeric()
    .withMessage("A data type number is expected")
    .replace(["1"], "2"),
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format")
    .normalizeEmail(),
  check("avatar")
    .trim()
    .notEmpty()
    .withMessage("Avatar are required")
    .bail()
    .isURL()
    .withMessage("Invalid URL avatar"),
  check("password")
    .trim()
    .notEmpty()
    .withMessage("Password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 6 characters"),
  manageValidationErrors,
];

export const updateDataValidations = [
  check("username")
    .trim()
    .notEmpty()
    .withMessage("Username are required")
    .escape()
    .withMessage("Invalid username format"),
  check("avatar")
    .trim()
    .notEmpty()
    .withMessage("Avatar are required")
    .bail()
    .isURL()
    .withMessage("Invalid URL avatar"),
];

export const loginDataValidations = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format")
    .normalizeEmail(),
  check("password")
    .trim()
    .notEmpty()
    .withMessage("Password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 6 characters"),
  manageValidationErrors,
];

export const changePassDataValidations = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format")
    .normalizeEmail(),
  check("old_password")
    .trim()
    .notEmpty()
    .withMessage("Password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 6 characters"),
  check("new_password")
    .trim()
    .notEmpty()
    .withMessage("New password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("New password must have a minimum of 6 characters"),
  manageValidationErrors,
];

export const emailValidations = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format"),
  manageValidationErrors,
];

export const taskDataValidations = [
  check("name").trim().notEmpty().withMessage("Name are required").escape(),
  check("project")
    .trim()
    .notEmpty()
    .withMessage("Project are required")
    .escape(),
  check("timing").trim().notEmpty().withMessage("Timing are required").escape(),
  check("month").trim().notEmpty().withMessage("Date are required").escape(),
  check("delivered")
    .trim()
    .notEmpty()
    .withMessage("Delivery are required")
    .bail()
    .isISO8601()
    .withMessage("Invalid date format. ISO8601 required")
    .bail()
    .toDate(),
  check("description").trim().escape(),
  manageValidationErrors,
];

export const idParamValidations = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID are required")
    .bail()
    .escape()
    .withMessage("Invalid ID param format"),
  manageValidationErrors,
];

export const uidParamValidations = [
  param("uid")
    .trim()
    .notEmpty()
    .withMessage("User ID are required")
    .bail()
    .escape()
    .withMessage("Invalid user ID param format"),
  manageValidationErrors,
];

export const confirmationTokenValidations = [
  param("confirmation_token")
    .trim()
    .notEmpty()
    .withMessage("Confirmation token are required")
    .bail()
    .escape()
    .withMessage("Invalid confirmation token param format"),
  manageValidationErrors,
];

export const resetPassDataValidations = [
  param("reset_password_token")
    .trim()
    .notEmpty()
    .withMessage("Reset password token are required")
    .bail()
    .escape()
    .withMessage("Invalid reset password token param format"),
  check("new_password")
    .trim()
    .notEmpty()
    .withMessage("New password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("New password must have a minimum of 6 characters"),
  manageValidationErrors,
];
