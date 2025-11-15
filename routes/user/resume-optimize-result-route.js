const express = require("express");
const router = express.Router();
const {
  getResumeOptimizeResults,
} = require("../../controllers/user/resume-optimize-result-controllet");
const { requireAuth } = require("../../middleware/authMiddleware");

/**
 * @resume-optimize-result   /api/v1/user/resume-optimize-history
 */

//Get optimized resume result history
router.get("/resume-optimize-history", requireAuth, getResumeOptimizeResults);

module.exports = router;
