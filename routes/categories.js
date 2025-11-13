const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');

// GET: Retrieve all available job categories
router.get('/categories', requireAuth, (req, res) => {
    const categories = [
        'Information Technology',
            'Education',
            'Finance',
            'Engineering',
            'Hospitality' ,
            'Other'
    ];

    res.json({
        success: true,
        categories
    });
});

module.exports = router;