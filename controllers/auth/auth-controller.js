const User = require("../../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const verifySession = (req, res, next) => {
  res.status(200).json({
    name: req.session.user.firstName,
    email: req.session.user.email,
  });
};

const signout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ message: "Logout failed" });
      }

      res.clearCookie("connect.sid"); // clear session cookie
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ Email_Address: email });
    if (!user) return res.status(400).json({ message: "User Not Found" });

    const match = await bcrypt.compare(password, user.Password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Track login count
    const isFirstLogin = user.loginCount === 0;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    req.session.user = {
      _id: user._id,
      role: user.role || "user",
      email: user.Email_Address,
      firstName: user.First_name,
    };

    return res.status(200).json({
      message: "Login successful",
      isFirstLogin, // ✅ Send to frontend
      user: {
        role: user.role,
        email: user.Email_Address,
        firstName: user.First_name,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
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
  //sign up
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
  // kailangan pareha ang password og confirm password
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
    //hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);
    console.log(First_name);
    //bag o na user dri
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
