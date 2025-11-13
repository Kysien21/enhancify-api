const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { requireAuth } = require("../middleware/authMiddleware");

// 📊 Get all results
router.get('/results', requireAuth, resultController.getresults);

// 📊 Get specific result by ID
router.get('/result/:resultId', requireAuth, resultController.getResultById);

// 📊 Get latest score
router.get('/score', requireAuth, resultController.getscore);

// 📄 Get original resume
router.get('/result/:resultId/original', requireAuth, resultController.getOriginalResume);

// 📄 Get optimized resume
router.get('/result/:resultId/optimized', requireAuth, resultController.getOptimizedResume);

// 💾 Save to history
router.post('/save-history', requireAuth, resultController.saveToHistory);

// 📥 Download optimized resume
router.get('/download/:resultId', requireAuth, resultController.downloadOptimized);

module.exports = router;
