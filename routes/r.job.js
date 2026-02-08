const router = require("express").Router();
const fetch = require("node-fetch");
const Job = require("../models/job");
const { protect, restrictTo } = require("../middlewares/m.auth");

router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(50);
    res.json({ jobs });
  } catch (e) { next(e); }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    const data = await r.json();
    const jobs = (data.jobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      type: j.job_type || "",
      tags: j.tags || [],
      url: j.url,
      source: "external",
      externalUrl: j.url
    }));
    res.json({ jobs });
  } catch (e) { next(e); }
});

router.get("/mine", protect, restrictTo("employer"), async (req, res, next) => {
  try {
    const jobs = await Job.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (e) { next(e); }
});

router.post("/", protect, restrictTo("employer"), async (req, res, next) => {
  try {
    const { title, company, location, salary, description } = req.body;

    if (!title || !company || !location || !salary || !description) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const job = await Job.create({
      owner: req.user.id,
      title,
      company,
      location,
      salary,
      description
    });

    res.status(201).json({ job });
  } catch (e) { next(e); }
});

router.put("/:id", protect, restrictTo("employer"), async (req, res, next) => {
  try {
    const { title, company, location, salary, description } = req.body;
    if (!title || !company || !location || !salary || !description) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const job = await Job.findOne({ _id: req.params.id, owner: req.user.id });
    if (!job) return res.status(404).json({ message: "Not found" });

    job.title = title;
    job.company = company;
    job.location = location;
    job.salary = salary;
    job.description = description;
    await job.save();

    res.json({ job });
  } catch (e) { next(e); }
});

router.delete("/:id", protect, restrictTo("employer"), async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user.id }, { createdBy: req.user.id }]
    });
    if (!job) return res.status(404).json({ message: "Not found" });
    await job.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Not found" });
    res.json(job);
  } catch (e) { next(e); }
});

module.exports = router;
