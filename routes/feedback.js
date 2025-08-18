const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { requireAuth } = require('../middleware/authMiddleware');

// ✅ Static Routes (must be defined before any dynamic ones)
router.get('/', requireAuth, feedbackController.getAllUserFeedback);
// Consistency & Accuracy
router.get('/consistency-score', requireAuth, feedbackController.getConsistencyScore);
router.get('/consistency-feedback', requireAuth, feedbackController.getConsistencyComment);

// Spelling & Grammar
router.get('/spelling-grammar-score', requireAuth, feedbackController.getSpellingScore);
router.get('/spelling-grammar-feedback', requireAuth, feedbackController.getSpellingComment);

// Education Qualification
router.get('/qualification-score', requireAuth, feedbackController.getQualificationScore);
router.get('/qualification-feedback', requireAuth, feedbackController.getQualificationComment);

// Education Relevance
router.get('/relevance-score', requireAuth, feedbackController.getRelevanceScore);
router.get('/relevance-feedback', requireAuth, feedbackController.getRelevanceComment);

// Work History
router.get('/work-history-score', requireAuth, feedbackController.getWorkHistoryScore);
router.get('/work-history-feedback', requireAuth, feedbackController.getWorkHistoryComment);

// Work History SKILL (dedicated endpoint names)
router.get('/work-history-skill-score', requireAuth, feedbackController.getWorkHistorySkillScore);
router.get('/work-history-skill-feedback', requireAuth, feedbackController.getWorkHistorySkillComment);

// Relevance to Job - Keyword Match (these were missing)
router.get('/keyword-match-score', requireAuth, feedbackController.getKeywordMatchScore);
router.get('/keyword-match-feedback', requireAuth, feedbackController.getKeywordMatchComment);

// Relevance to Job - Keyword Skill Match
router.get('/keyword-skill-match-score', requireAuth, feedbackController.getSkillMatchScore);
router.get('/keyword-skill-match-feedback', requireAuth, feedbackController.getSkillMatchComment);

// Dynamic Route — MUST stay last to avoid route conflicts
router.get('/:resultId', requireAuth, feedbackController.getFeedbackByResultId);

module.exports = router;