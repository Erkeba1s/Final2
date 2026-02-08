const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["employer", "candidate"], required: true },
    // Extra candidate info filled during registration/edit.
    profile: {
      fullName: { type: String, trim: true, default: "" },
      title: { type: String, trim: true, default: "" },
      location: { type: String, trim: true, default: "" },
      bio: { type: String, trim: true, default: "" },
      skills: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
