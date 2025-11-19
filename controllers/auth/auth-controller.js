const User = require("../../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const verifySession = (req, res, next) => {
  // ✅ DEBUG: Log everything
  console.log("🔍 verifySession called");
  console.log("Session ID:", req.sessionID);
  console.log("Session object:", req.session);
  console.log("Session user:", req.session?.user);
  console.log("Cookies received:", req.headers.cookie);
  
  // ✅ Add check if session exists
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

const signout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // ✅ Clear cookie with correct settings
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

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

    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // ✅ Track login count
    const isFirstLogin = user.loginCount === 0;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    console.log("✅ User authenticated, creating session for:", email);

    // ✅ Store user in session
    req.session.user = {
      _id: user._id,
      role: user.role || "user",
      email: user.Email_Address,
      firstName: user.First_name,
    };

    console.log("📝 Session user set:", req.session.user);

    // ✅ CRITICAL: Save session BEFORE sending response
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
      console.log("Session data:", req.session);
      
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
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message 
    });
  }
};

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

  if (Password !== Confirm_Password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ Email_Address });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Account already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);
    
    const user = new User({
      First_name,
      Last_name,
      Mobile_No,
      Email_Address,
      Password: hashedPassword,
    });

    const savedUser = await user.save();

    res
      .status(201)
      .json({ message: "You created successfully", user: savedUser });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

module.exports = {
  verifySession,
  signout,
  signin,
  signup,
};