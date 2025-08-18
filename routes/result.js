const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { requireAuth } = require("../middleware/authMiddleware");

// 📄 Resume Result Routes
router.get('/results', requireAuth, resultController.getresults);
router.get('/score', requireAuth, resultController.getscore);

// 📥 Download + Delete route (PDF or DOCX)
router.get('/download/:resumeId', requireAuth, resultController.downloadOptimized);

// ✅ New routes for side-by-side viewing
router.get('/original', requireAuth, resultController.getOriginalResume);
router.get('/optimized', requireAuth, resultController.getOptimizedResume);

module.exports = router;