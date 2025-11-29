const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth/auth-controller");
const { forgotPassword, resetPassword } = authController;

// POST request with email to get reset link
router.post("/forgot-password", forgotPassword);

// POST request with new password
router.post("/reset-password/:token", resetPassword);

module.exports = router;
