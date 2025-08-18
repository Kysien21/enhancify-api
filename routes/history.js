const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/history', requireAuth, historyController.getUserHistory)
module.exports = router