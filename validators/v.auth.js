const { body } = require("express-validator");

exports.register = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("email is invalid").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("password min 6"),
  body("role").isIn(["employer", "candidate"]).withMessage("role invalid"),
  // candidate extra profile fields (optional)
  body("profile.fullName").optional().trim(),
  body("profile.title").optional().trim(),
  body("profile.location").optional().trim(),
  body("profile.bio").optional().trim(),
  body("profile.skills").optional().isArray().withMessage("skills must be array")
];

exports.login = [
  body("email").isEmail().withMessage("email is invalid").normalizeEmail(),
  body("password").notEmpty().withMessage("password is required")
];
