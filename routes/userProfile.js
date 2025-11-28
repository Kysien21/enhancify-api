const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  deleteAccount
} = require('../controllers/userProfileController');

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/v1/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/v1/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateUserProfile);

/**
 * @route   PUT /api/v1/user/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', updatePassword);

/**
 * @route   DELETE /api/v1/user/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', deleteAccount);

module.exports = router;