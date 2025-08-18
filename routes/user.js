const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/me', async(req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Not logged in' });
        }

        const user = await User.findById(req.session.user._id).select('First_name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ name: user.First_name });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;