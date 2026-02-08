const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vacancy", JobSchema);
