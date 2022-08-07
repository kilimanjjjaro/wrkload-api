import { body, param, validationResult } from "express-validator";

// CREATE A MIDDLEWARE TO MANAGE ERRORS FROM DATA VALIDATIONS.
export const manageValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  next();
};

// CREATE VALIDATIONS FOR DATA TYPES
export const registryDataValidations = [
  body("username").trim().notEmpty().withMessage("Username are required"),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role are required")
    .bail()
    .isNumeric()
    .withMessage("A data type number is expected")
    .replace(["1"], "2"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format")
    .normalizeEmail(),
  body("avatar")
    .trim()
    .notEmpty()
    .withMessage("Avatar are required")
    .bail()
    .isURL()
    .withMessage("Invalid URL avatar"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 6 characters"),
  manageValidationErrors,
];

export const loginDataValidations = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email are required")
    .bail()
    .isEmail()
    .withMessage("Incorrect email format")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password are required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must have a minimum of 6 characters"),
  manageValidationErrors,
];

export const taskDataValidations = [
  body("name").trim().notEmpty().withMessage("Name are required"),
  body("project").trim().notEmpty().withMessage("Project are required"),
  body("timing").trim().notEmpty().withMessage("Timing are required"),
  body("month").trim().notEmpty().withMessage("Date are required"),
  body("delivered")
    .trim()
    .notEmpty()
    .withMessage("Delivery are required")
    .bail()
    .isISO8601()
    .withMessage("Invalid date format. ISO8601 required")
    .bail()
    .toDate(),
  body("description").trim(),
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
