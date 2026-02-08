const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: String,
    title: String,
    location: String,
    bio: String,
    skills: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
