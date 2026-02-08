const router = require("express").Router();
const User = require("../models/User");
const Job = require("../models/job");
const SavedJob = require("../models/svdJob");
const { protect } = require("../middlewares/m.auth");

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role createdAt profile");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/me", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    await SavedJob.deleteMany({ user: userId });
    await Job.deleteMany({ $or: [{ owner: userId }, { createdBy: userId }] });
    await User.deleteOne({ _id: userId });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
