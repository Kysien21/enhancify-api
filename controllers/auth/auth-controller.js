const User = require("../../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require('../../utils/emailService');

// ==================== SESSION VERIFICATION ====================
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
const signout = (req, res) => {
  try {
    const userEmail = req.session?.user?.email || 'Unknown';
    const userRole = req.session?.user?.role || 'Unknown';
    
    console.log(`🚪 Logout initiated for: ${userEmail} (${userRole})`);

    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ 
          success: false,
          message: "Logout failed" 
        });
      }

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
const signin = async (req, res) => {
  const { email, password } = req.body;

  console.log("🔐 Login attempt for:", email);

  try {
    const user = await User.findOne({ Email_Address: email });
    
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ 
        success: false,
        message: "User Not Found" 
      });
    }

    if (!user.isActive) {
      console.log("🚫 Blocked user attempted login:", email);
      return res.status(403).json({ 
        success: false,
        message: "Your account has been blocked. Please contact support." 
      });
    }

    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const isFirstLogin = user.loginCount === 0;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ User authenticated, creating session for:", email);

    req.session.regenerate((err) => {
      if (err) {
        console.error("❌ Session regeneration error:", err);
        return res.status(500).json({ 
          success: false,
          message: "Session creation failed" 
        });
      }

      req.session.user = {
        _id: user._id,
        role: user.role || "user",
        email: user.Email_Address,
        firstName: user.First_name,
      };

      console.log("📝 Session user set:", req.session.user);

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
const signup = async (req, res) => {
  // ✅ LOG REQUEST BODY FOR DEBUGGING
  console.log("📥 Signup request body:", JSON.stringify(req.body, null, 2));
  
  const {
    First_name,
    Last_name,
    Category, // ✅ Frontend sends capitalized "Category"
    Email_Address,
    Password,
    Confirm_Password,
    agreeToTerms,
  } = req.body;
  
  // ✅ Convert to lowercase for database
  let category = Category;
  
  console.log("🔍 Raw Category from frontend:", `"${Category}"`);
  console.log("🔍 Category length:", Category?.length);
  console.log("🔍 Category type:", typeof Category);
  
  // ✅ Category mapping - convert frontend values to backend format
  const categoryMapping = {
    'technology': 'Information Technology',
    'information technology': 'Information Technology',
    'engineering': 'Engineering',
    'business': 'Business Administration',
    'business administration': 'Business Administration',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'marketing': 'Marketing',
    'finance': 'Finance',
    'hr': 'Human Resources',
    'human resources': 'Human Resources',
    'sales': 'Sales',
    'customer service': 'Customer Service',
    'other': 'Other'
  };
  
  // ✅ Normalize category - trim and convert to lowercase for matching
  if (category) {
    const normalizedInput = category.trim().toLowerCase();
    category = categoryMapping[normalizedInput] || category.trim();
  }
  
  console.log("🔍 Mapped category:", `"${category}"`);

  // ✅ Updated validation - no Mobile_No, added category
  if (
    !First_name ||
    !Last_name ||
    !Email_Address ||
    !Password ||
    !Confirm_Password
  ) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      success: false,
      message: "All fields are required (First Name, Last Name, Email, Password, Confirm Password)" 
    });
  }

  // ✅ Validate category (only for regular users)
  const validCategories = [
    'Information Technology',
    'Engineering',
    'Business Administration',
    'Healthcare',
    'Education',
    'Marketing',
    'Finance',
    'Human Resources',
    'Sales',
    'Customer Service',
    'Other'
  ];

  // Category is required for non-admin signups
  if (!category || category.trim() === '') {
    console.log("❌ Category is missing or empty");
    return res.status(400).json({ 
      success: false,
      message: "Category is required. Please select a department." 
    });
  }

  // ✅ Validate mapped category
  if (!validCategories.includes(category)) {
    console.log("❌ Invalid category after mapping:", `"${category}"`);
    console.log("📋 Valid categories:", validCategories);
    return res.status(400).json({ 
      success: false,
      message: `Invalid category: "${category}". Must be one of: ${validCategories.join(', ')}` 
    });
  }

  if (Password !== Confirm_Password) {
    return res.status(400).json({ 
      success: false,
      message: "Passwords do not match" 
    });
  }

  // ✅ Password strength validation
  if (Password.length < 10) { // ✅ Match frontend's 10 character requirement
    return res.status(400).json({ 
      success: false,
      message: "Password must be at least 10 characters long" 
    });
  }

  try {
    const existingUser = await User.findOne({ Email_Address });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Account already exists with this email" 
      });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);
    
    console.log("👤 Creating new user:", First_name, Last_name, "- Category:", category);
    
    // ✅ Create user with category instead of Mobile_No
    const user = new User({
      First_name,
      Last_name,
      category: category, // ✅ Use mapped category
      Email_Address,
      Password: hashedPassword,
      isActive: true,
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
        category: savedUser.category,
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
 * ✅ UPDATED: No longer requires mobile number
 * Only email is needed for password reset
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false,
      message: "Email address is required." 
    });
  }

  try {
    const user = await User.findOne({ Email_Address: email });

    // Security: Don't reveal if email exists
    if (!user) {
      console.log("⚠️ Password reset requested for non-existent email:", email);
      return res.status(200).json({ 
        success: true,
        message: "If an account exists with this email, a password reset link has been sent."
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log("⚠️ Password reset requested for blocked account:", email);
      return res.status(200).json({ 
        success: true,
        message: "If an account exists with this email, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    console.log(`📧 Sending reset email to: ${user.Email_Address}`);
    
    // Send email
    const emailResult = await sendPasswordResetEmail(
      user.Email_Address,
      resetLink,
      user.First_name
    );

    if (emailResult.success) {
      console.log(`✅ Password reset email sent successfully`);
      return res.json({ 
        success: true,
        message: "Password reset link has been sent to your email. Please check your inbox."
      });
    } else {
      console.error("❌ Email send failed:", emailResult.error);
      
      // Clear token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later."
      });
    }
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ 
      success: false,
      message: "An error occurred. Please try again later."
    });
  }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ 
      success: false,
      message: "Both password fields are required" 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      success: false,
      message: "Passwords do not match" 
    });
  }

  if (newPassword.length < 10) { // ✅ Match signup validation
    return res.status(400).json({ 
      success: false,
      message: "Password must be at least 10 characters long" 
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Password reset link is invalid or has expired. Please request a new one." 
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
      message: "Password has been reset successfully. You can now login with your new password." 
    });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Password reset failed. Please try again."
    });
  }
};

// ==================== EXPORTS ====================
module.exports = {
  verifySession,
  signin,
  signup,
  signout,
  login: signin,
  logout: signout,
  forgotPassword,
  resetPassword,
};