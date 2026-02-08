const router = require("express").Router();
const SavedJob = require("../models/svdJob");
const Job = require("../models/job");
const { protect, restrictTo } = require("../middlewares/m.auth");

router.post("/", protect, restrictTo("candidate"), async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ message: "jobId is required" });

    const job = await Job.findById(jobId).select("_id");
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await SavedJob.findOne({ user: req.user.id, jobId });
    if (existing) return res.status(200).json({ saved: existing });

    const saved = await SavedJob.create({ user: req.user.id, jobId });
    res.status(201).json({ saved });
  } catch (e) { next(e); }
});

router.get("/", protect, restrictTo("candidate"), async (req, res, next) => {
  try {
    const items = await SavedJob.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: "jobId", select: "title company location salary description createdAt" })
      .lean();

    const mapped = items.map((i) => {
      const job = i.jobId && i.jobId._id ? i.jobId : null;
      const jobId = job ? job._id : i.jobId;
      return { id: i._id, jobId, job };
    });

    res.json({ items: mapped });
  } catch (e) { next(e); }
});

module.exports = router;
