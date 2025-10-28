const express = require('express');
const router = express.Router();
const passport = require('passport');

// Check logged-in user
router.get('/check', (req, res) => {
  if (!req.user) {
    return res.status(200).json({ authenticated: false, user: null });
  }

  res.status(200).json({
    authenticated: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username
    }
  });
});

// -------------------- GOOGLE --------------------
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    res.redirect('http://localhost:5173/dashboard');
  }
);

// -------------------- FACEBOOK --------------------
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    res.redirect('http://localhost:5173/dashboard');
  }
);


module.exports = router;
