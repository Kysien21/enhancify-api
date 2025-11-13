// backend/routes/subscription.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// User routes
router.post('/create', requireAuth, subscriptionController.createSubscription);
router.get('/status', requireAuth, subscriptionController.getSubscriptionStatus);
router.post('/cancel/:subscriptionId', requireAuth, subscriptionController.cancelSubscription);

// Admin routes (add admin middleware if you have one)
router.get('/all', requireAuth, subscriptionController.getAllSubscriptions);
router.post('/approve/:subscriptionId', requireAuth, subscriptionController.approveSubscription);

module.exports = router;