const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../routes/utils/apiError");
const ah = require("../routes/utils/asyncHandler");
const { JWT_SECRET } = require("../config/env");

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

exports.register = ah(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Missing fields");
  }

  if (role !== "employer" && role !== "candidate") {
    throw new ApiError(400, "Invalid role");
  }

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, "Email already used");

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hash,
    role
  });

  const token = signToken(user);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});


exports.login = ah(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Missing fields");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
