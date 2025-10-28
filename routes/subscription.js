// routes/subscription.js
const express = require('express');
const router = express.Router();
const { requireSubscription } = require('../middleware/subscriptionMiddleware');

// Example protected route
router.get('/', requireSubscription, (req, res) => {
    res.json({ message: 'You have an active subscription!' });
});

module.exports = router;
