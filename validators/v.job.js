const { body, param } = require("express-validator");

exports.createJob = [
  body("title").trim().notEmpty(),
  body("company").trim().notEmpty(),
  body("location").trim().notEmpty(),
  body("salary").trim().notEmpty(),
  body("description").trim().notEmpty()
];

exports.updateJob = [
  param("id").isMongoId().withMessage("invalid id"),
  body("title").trim().notEmpty(),
  body("company").trim().notEmpty(),
  body("location").trim().notEmpty(),
  body("salary").trim().notEmpty(),
  body("description").trim().notEmpty()
];

exports.getJob = [ param("id").isMongoId().withMessage("invalid id") ];
