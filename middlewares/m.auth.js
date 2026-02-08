const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
