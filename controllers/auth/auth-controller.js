const User = require("../../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ==================== SESSION VERIFICATION ====================
/**
 * Verify if user has a valid session
 * Used by frontend to check authentication status
 */
const verifySession = (req, res, next) => {
  console.log("🔍 verifySession called");
  console.log("Session ID:", req.sessionID);
  console.log("Session user:", req.session?.user);
  
  if (!req.session || !req.session.user) {
    console.log("❌ No session or user found - returning 401");
    return res.status(401).json({ 
      authenticated: false,
      message: "Not authenticated" 
    });
  }

  console.log("✅ Session valid, returning user data");
  res.status(200).json({
    authenticated: true,
    name: req.session.user.firstName,
    email: req.session.user.email,
    role: req.session.user.role,
  });
};

// ==================== SIGN OUT / LOGOUT ====================
/**
 * ✅ FIXED: Properly destroy user session and clear cookies
 * Works for both /signout and /logout endpoints
 */
const signout = (req, res) => {
  try {
    const userEmail = req.session?.user?.email || 'Unknown';
    const userRole = req.session?.user?.role || 'Unknown';
    
    console.log(`🚪 Logout initiated for: ${userEmail} (${userRole})`);

    // ✅ CRITICAL FIX: Destroy session FIRST, then clear cookie in callback
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ 
          success: false,
          message: "Logout failed" 
        });
      }

      // ✅ Clear cookie AFTER session is destroyed
      res.clearCookie("connect.sid", {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      
      console.log(`✅ User logged out successfully: ${userEmail}`);
      
      return res.status(200).json({ 
        success: true,
        message: "Logged out successfully" 
      });
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ 
      success: false,
      message: "Something went wrong" 
    });
  }
};

// ==================== SIGN IN / LOGIN ====================
/**
 * Authenticate user and create session
 * ✅ Checks if user account is blocked (isActive)
 * Works for both /signin and /login endpoints
 */
const signin = async (req, res) => {
  const { email, password } = req.body;

  console.log("🔐 Login attempt for:", email);

  try {
    // Find user by email
    const user = await User.findOne({ Email_Address: email });
    
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ 
        success: false,
        message: "User Not Found" 
      });
    }

    // ✅ CRITICAL: Check if user account is blocked
    if (!user.isActive) {
      console.log("🚫 Blocked user attempted login:", email);
      return res.status(403).json({ 
        success: false,
        message: "Your account has been blocked. Please contact support." 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Track login statistics
    const isFirstLogin = user.loginCount === 0;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ User authenticated, creating session for:", email);

    // ✅ CRITICAL FIX: Regenerate session on login to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error("❌ Session regeneration error:", err);
        return res.status(500).json({ 
          success: false,
          message: "Session creation failed" 
        });
      }

      // Create session data
      req.session.user = {
        _id: user._id,
        role: user.role || "user",
        email: user.Email_Address,
        firstName: user.First_name,
      };

      console.log("📝 Session user set:", req.session.user);

      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ 
            success: false,
            message: "Session creation failed" 
          });
        }

        console.log("✅ Session saved successfully!");
        console.log("Session ID:", req.sessionID);
        
        return res.status(200).json({
          success: true,
          message: "Login successful",
          isFirstLogin,
          user: {
            id: user._id,
            email: user.Email_Address,
            role: user.role || "user",
            firstName: user.First_name,
          },
        });
      });
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message 
    });
  }
};

// ==================== SIGN UP / REGISTER ====================
/**
 * Create new user account
 * Validates input and creates user with hashed password
 */
const signup = async (req, res) => {
  const {
    First_name,
    Last_name,
    Mobile_No,
    Email_Address,
    Password,
    Confirm_Password,
    agreeToTerms,
  } = req.body;

  // Validate required fields
  if (
    !First_name ||
    !Last_name ||
    !Mobile_No ||
    !Email_Address ||
    !Password ||
    !Confirm_Password
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required and terms must be accepted" });
  }

  // Validate password match
  if (Password !== Confirm_Password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ Email_Address });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Account already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);
    
    console.log("👤 Creating new user:", First_name, Last_name);
    
    // Create new user
    const user = new User({
      First_name,
      Last_name,
      Mobile_No,
      Email_Address,
      Password: hashedPassword,
      isActive: true, // ✅ New users are active by default
    });

    const savedUser = await user.save();
    
    console.log("✅ User created successfully:", savedUser.Email_Address);

    res.status(201).json({ 
      success: true,
      message: "Account created successfully", 
      user: {
        id: savedUser._id,
        email: savedUser.Email_Address,
        firstName: savedUser.First_name,
      }
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Something went wrong. Please try again." 
    });
  }
};

// ==================== FORGOT PASSWORD ====================
/**
 * Generate password reset token
 * Requires both email and mobile number for security
 */
const forgotPassword = async (req, res) => {
  const { email, mobile } = req.body;

  if (!email || !mobile) {
    return res.status(400).json({ 
      message: "Email and mobile number are required." 
    });
  }

  try {
    // Find user by both email and mobile (extra security)
    const user = await User.findOne({ 
      Email_Address: email, 
      Mobile_No: mobile 
    });

    if (!user) {
      return res.status(400).json({ 
        message: "No account found with this email and mobile number." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log("📩 Password reset link:", resetLink);

    // TODO: Send email/SMS with reset link (integrate Nodemailer or Twilio)
    
    res.json({ 
      success: true,
      message: "Password reset link sent (check your email or SMS)", 
      link: resetLink // Remove in production
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ 
      message: "Error sending reset link", 
      error: err.message 
    });
  }
};

// ==================== RESET PASSWORD ====================
/**
 * Reset user password using valid token
 * Token expires after 1 hour
 */
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    // Find user with valid token (not expired)
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired token. Please request a new reset link." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    
    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("✅ Password reset successful for:", user.Email_Address);

    res.json({ 
      success: true,
      message: "Password has been reset successfully" 
    });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ 
      message: "Reset failed", 
      error: err.message 
    });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  // Session Management
  verifySession,
  
  // Authentication
  signin,
  signup,
  signout,
  
  // Aliases for backward compatibility
  login: signin,      // /login works same as /signin
  logout: signout,    // /logout works same as /signout
  
  // Password Recovery
  forgotPassword,
  resetPassword,
};