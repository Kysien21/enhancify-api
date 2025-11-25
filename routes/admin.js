const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authMiddleware");
const adminStatsController = require("../controllers/adminStatsController");

// ===================== OVERVIEW / HOME =====================

router.get(
  "/overview",
  requireRole("admin"),
  adminStatsController.getOverviewStats
);

router.get(
  "/system-activity-graph",
  requireRole("admin"),
  adminStatsController.getSystemActivityGraph
);

router.get(
  "/recent-analyses",
  requireRole("admin"),
  adminStatsController.getRecentAnalyses
);

// ===================== MONTHLY STATS =====================
router.get(
  "/dashboard/monthly-stats",
  requireRole("admin"),
  adminStatsController.getMonthlyStats
);

// ===================== REPORTS AND ANALYTICS =====================
router.get(
  "/reports/analytics",
  requireRole("admin"),
  adminStatsController.getReportsAnalytics
);

router.get(
  "/reports/usage-over-time",
  requireRole("admin"),
  adminStatsController.getSystemUsageOverTime
);

// ===================== USER MANAGEMENT =====================
router.get(
  "/users",
  requireRole("admin"),
  adminStatsController.getUsersList
);

router.get(
  "/users/:userId",
  requireRole("admin"),
  adminStatsController.getUserDetails
);

router.delete(
  "/users/:userId",
  requireRole("admin"),
  adminStatsController.deleteUser
);

router.patch(
  "/users/:userId/toggle-status",
  requireRole("admin"),
  adminStatsController.toggleUserStatus
);

// ===================== SYSTEM MANAGEMENT =====================
router.post("/change-password",
  requireRole("admin"),
  adminStatsController.changeAdminPassword
);

// ✅ REMOVED: /create-admin route - Only one admin via script

// ===================== MAIN DASHBOARD =====================
router.get("/dashboard", requireRole("admin"), (req, res) => {
  res.json({
    success: true,
    message: "🧑‍💼 Welcome to the Admin Dashboard",
    user: {
      email: req.session.user.email,
      role: req.session.user.role,
    },
  });
});

module.exports = router;