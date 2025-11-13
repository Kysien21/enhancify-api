const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const History = require('../models/History');

// GET: User's history
router.get('/history', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const history = await History.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            success: true,
            history
        });
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Could not fetch history' });
    }
});

// GET: History item details
router.get('/history/:historyId', requireAuth, async (req, res) => {
    try {
        const { historyId } = req.params;
        const history = await History.findOne({
            _id: historyId,
            userId: req.session.user._id
        });

        if (!history) {
            return res.status(404).json({ message: 'History item not found' });
        }

        res.json({
            success: true,
            history
        });
    } catch (err) {
        console.error('Error fetching history item:', err);
        res.status(500).json({ error: 'Could not fetch history item' });
    }
});

// DELETE: Remove history item
router.delete('/history/:historyId', requireAuth, async (req, res) => {
    try {
        const { historyId } = req.params;
        await History.findOneAndDelete({
            _id: historyId,
            userId: req.session.user._id
        });

        res.json({
            success: true,
            message: 'History item deleted'
        });
    } catch (err) {
        console.error('Error deleting history item:', err);
        res.status(500).json({ error: 'Could not delete history item' });
    }
});

module.exports = router;
