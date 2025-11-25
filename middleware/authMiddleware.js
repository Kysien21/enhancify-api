exports.requireAuth = async (req, res, next) => {
  console.log("Session User:", req.session.user);
  
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please login first.",
      redirectTo: "/login",
    });
  }

  // ✅ Check if user is still active (not blocked)
  try {
    const User = require('../models/User');
    const user = await User.findById(req.session.user._id);
    
    if (!user || !user.isActive) {
      // Destroy session if user is blocked
      req.session.destroy();
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
        redirectTo: "/login",
      });
    }
  } catch (error) {
    console.error("Error checking user status:", error);
  }

  next();
};

exports.requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // ✅ Check if user is still active
    try {
      const User = require('../models/User');
      const user = await User.findById(req.session.user._id);
      
      if (!user || !user.isActive) {
        req.session.destroy();
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked. Please contact support.",
        });
      }

      if (user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

    next();
  };
};