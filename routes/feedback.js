const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { requireAuth } = require('../middleware/authMiddleware');

// ✅ Get all feedback for the logged-in user
router.get('/feedback', requireAuth, feedbackController.getAllUserFeedback);

// ✅ Get feedback by result ID
router.get('/:resultId', requireAuth, feedbackController.getFeedbackByResultId);

// ✅ Individual field endpoints (optional, if you want to fetch them separately)
router.get('/:resultId/ats-score', requireAuth, feedbackController.getATSScore);
router.get('/:resultId/readability-score', requireAuth, feedbackController.getReadabilityScore);
router.get('/:resultId/brief-summary', requireAuth, feedbackController.getBriefSummary);

module.exports = router;
