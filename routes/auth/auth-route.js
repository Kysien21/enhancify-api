const express = require("express");
const router = express.Router();
const {
  verifySession,
  signout,
  signin,
  signup,
} = require("../../controllers/auth/auth-controller");
// ❌ DON'T import requireAuth for the /me route
// const { requireAuth } = require("../../middleware/authMiddleware");

/**
 * @signin   /api/v1/auth/signin
 * @signup   /api/v1/auth/signup
 * @signout  /api/v1/auth/signout
 * @me       /api/v1/auth/me
 */

//Signup route
router.post("/signup", signup);

//Signin route
router.post("/signin", signin);

//verify route - ✅ REMOVE requireAuth middleware
router.get("/me", verifySession); // verifySession handles auth check itself

//logout route
router.post("/signout", signout);

module.exports = router;