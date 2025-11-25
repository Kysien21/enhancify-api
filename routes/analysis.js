const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { requireAuth } = require('../middleware/authMiddleware');
// ✅ REMOVED: subscription middleware

// ✅ Step 1: Initial analysis (scores only, after upload)
// ✅ REMOVED checkUsageLimit middleware - no subscription system
router.post('/analyze-initial', 
    requireAuth, 
    analysisController.analyzeResumeInitial
);

// ✅ Step 2: Optimize/Enhancify resume (when user clicks "Enhancify")
router.post('/optimize', 
    requireAuth,
    analysisController.optimizeResume
);

// ✅ Step 3: Update optimized resume (when user edits)
router.put('/update-optimized',
    requireAuth,
    analysisController.updateOptimizedResume
);

// Keep old route for backward compatibility
router.post('/analyze', requireAuth, analysisController.analyzeResume);

module.exports = router;