const User = require("../models/User");
const ApiError = require("../routes/utils/apiError");
const ah = require("../routes/asyncHandler");

exports.profile = ah(async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  res.json(user);
});
