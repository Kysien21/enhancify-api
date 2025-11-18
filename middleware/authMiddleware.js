exports.requireAuth = (req, res, next) => {
  console.log("Session User:", req.session.user);
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please login first.",
      redirectTo: "/login",
    });
  }
  next();
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied",
      });
    }

    next();
  };
};
