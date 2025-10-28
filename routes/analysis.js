const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { requireAuth } = require('../middleware/authMiddleware')
const { checkUsageLimit } = require('../middleware/subscriptionMiddleware');

router.post('/analyze', requireAuth, analysisController.analyzeResume);
module.exports = router;

const Result = require('../models/Result'); // make sure this is imported

// GET route to fetch latest score
router.get('/analysis-score', requireAuth, async(req, res) => {
    try {
        const userId = req.session.user._id;

        const latestResult = await Result.findOne({ userId })
            .sort({ createdAt: -1 }) // get the most recent
            .select('overallScore'); // only return overallScore

        if (!latestResult) {
            return res.status(404).json({ message: 'No result found' });
        }

        res.status(200).json({ overallScore: latestResult.overallScore });
    } catch (err) {
        console.error('❌ Failed to fetch score:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update the analyze route
router.post('/analyze', 
    requireAuth, 
    checkUsageLimit,  // ✨ Add this
    analysisController.analyzeResume
);