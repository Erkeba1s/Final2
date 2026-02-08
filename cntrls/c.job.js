const Job = require("../models/job");
const ApiError = require("../routes/utils/apiError");
const ah = require("../routes/utils/asyncHandler");

exports.create = ah(async (req, res) => {
  const { title, description, status } = req.body;

  if (!title) throw new ApiError(400, "Title is required");

  const job = await Job.create({ title, description, status, user: req.userId });
  res.status(201).json(job);
});

exports.getAll = ah(async (req, res) => {
  const jobs = await Job.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(jobs);
});

exports.getOne = ah(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.userId });
  if (!job) throw new ApiError(404, "Not found");
  res.json(job);
});

exports.update = ah(async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true }
  );
  if (!job) throw new ApiError(404, "Not found");
  res.json(job);
});

exports.remove = ah(async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!job) throw new ApiError(404, "Not found");
  res.status(204).send();
});
