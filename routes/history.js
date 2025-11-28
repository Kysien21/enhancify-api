const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const History = require('../models/History');

// GET: User's history with formatted time
router.get('/history', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const history = await History.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        // Format history with time
        const formattedHistory = history.map(item => ({
            ...item,
            formattedDate: new Date(item.timestamp || item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            formattedTime: new Date(item.timestamp || item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            formattedDateTime: new Date(item.timestamp || item.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        }));

        res.json({
            success: true,
            history: formattedHistory
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
        }).lean();

        if (!history) {
            return res.status(404).json({ message: 'History item not found' });
        }

        // Add formatted date and time
        const formattedHistory = {
            ...history,
            formattedDate: new Date(history.timestamp || history.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            formattedTime: new Date(history.timestamp || history.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            formattedDateTime: new Date(history.timestamp || history.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };

        res.json({
            success: true,
            history: formattedHistory
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