const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');

router.get('/admin/dashboard', requireRole('admin'), (req, res) => {
    res.json({
        message: '🧑‍💼 Welcome to the Admin Dashboard'
    })
})

const User = require('../models/User');

router.get('/admin/users', requireRole('admin'), async(req, res) => {
    try {
        const users = await User.find({});
        res.json({
            message: '🧑‍💼 Welcome to the Admin Dashboard',
            users
        })
    } catch (err) {
        res.status(500).json({
            message: 'Failed to fetch users'
        })
    }
})

module.exports = router;