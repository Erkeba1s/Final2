const mongoose = require("mongoose");

const svdJobSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Vacancy", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedJob", svdJobSchema);
