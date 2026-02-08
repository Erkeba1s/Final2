const express = require("express");
const path = require("path");
const connectDB = require("../config/db");
const { PORT } = require("../config/env");

const authRoutes = require("../routes/r.auth");
const jobRoutes = require("../routes/r.job");
const profileRoutes = require("../routes/r.profile");
const savedJobRoutes = require("../routes/r.svdJob");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/saved-jobs", savedJobRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "profile.html"));
});

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
