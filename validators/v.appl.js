const { body } = require("express-validator");

exports.updateProfile = [
  body("name").optional().trim(),
  body("profile.fullName").optional().trim(),
  body("profile.title").optional().trim(),
  body("profile.location").optional().trim(),
  body("profile.bio").optional().trim(),
  body("profile.skills").optional().isArray().withMessage("skills must be array")
];
