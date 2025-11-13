const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const Result = require('../models/Result');

router.get('/stats/by-category', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        const stats = await Result.aggregate([
            { $match: { userId } },
            { 
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$overallScore' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

module.exports = router;