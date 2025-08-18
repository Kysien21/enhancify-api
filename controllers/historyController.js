const History = require('../models/History')

exports.getUserHistory = async(req, res) => {
    try {
        const userId = req.session.user._id;
        const history = await History.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch history' });
    }
};