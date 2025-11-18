const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


exports.signup = async(req, res) => {
    const {
        First_name,
        Last_name,
        Mobile_No,
        Email_Address,
        Password,
        Confirm_Password,
        agreeToTerms
    } = req.body
        //sign up 
    if (!First_name || !Last_name || !Mobile_No || !Email_Address || !Password || !Confirm_Password) {
        return res.status(400).json({ message: "All fields are required and terms must be accepted" })
    }
    // kailangan pareha ang password og confirm password
    if (Password !== Confirm_Password) {
        return res.status(400).json({ message: 'Passwords do not match' })
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ Email_Address });
        if (existingUser) {
            return res.status(400).json({ message: 'Account already exists with this email' });
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(Password, 10)
        console.log(First_name)
            //bag o na user dri
        const user = new User({
            First_name,
            Last_name,
            Mobile_No,
            Email_Address,
            Password: hashedPassword,
        })

        const savedUser = await user.save()

        res.status(201).json({ message: 'You created successfully', user: savedUser })
    } catch (error) {
        console.error("❌ Signup error:", error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
}

// Update authController.js login function
exports.login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ Email_Address: email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'User Not Found' 
            });
        }

        const match = await bcrypt.compare(password, user.Password);
        if (!match) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // ✅ Track login count
        const isFirstLogin = user.loginCount === 0;
        user.loginCount += 1;
        user.lastLogin = new Date();
        await user.save();

        // ✅ Store user in session
        req.session.user = {
            _id: user._id,
            role: user.role || 'user',
            email: user.Email_Address,
            firstName: user.First_name,
        };

        // ✅ Save session before sending response
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Session creation failed' 
                });
            }

            console.log('✅ Session saved successfully:', req.session.id);
            console.log('✅ User logged in:', user.Email_Address, 'Role:', user.role);
            
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                isFirstLogin,
                user: {
                    id: user._id,
                    email: user.Email_Address,
                    role: user.role || 'user',
                    firstName: user.First_name,
                }
            });
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Login failed', 
            error: error.message 
        });
    }
};

// Verify session endpoint
exports.verifySession = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                authenticated: false,
                message: 'Not authenticated' 
            });
        }

        res.status(200).json({
            authenticated: true,
            user: req.session.user
        });
    } catch (error) {
        console.error('❌ Session verification error:', error);
        res.status(500).json({ 
            authenticated: false,
            message: 'Verification failed' 
        });
    }
};

// Logout controller
exports.logout = async(req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("❌ Error destroying session:", err);
                return res.status(500).json({ 
                    success: false,
                    message: "Logout failed" 
                });
            }

            res.clearCookie("connect.sid", {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });
            
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


// Forgot Password (email + mobile number)
exports.forgotPassword = async (req, res) => {
    const { email, mobile } = req.body;

    if (!email || !mobile) {
        return res.status(400).json({ message: "Email and mobile number are required." });
    }

    try {
        // Check both email and mobile number
        const user = await User.findOne({ Email_Address: email, Mobile_No: mobile });

        if (!user) {
            return res.status(400).json({ message: "No account found with this email and mobile number." });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset link (change to your frontend URL when deployed)
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        console.log("📩 Password reset link:", resetLink);

        // TODO: integrate email/SMS service (like Nodemailer or Twilio)
        res.json({ 
            message: "Password reset link sent (check your email or SMS)", 
            link: resetLink 
        });
    } catch (err) {
        res.status(500).json({ message: "Error sending reset link", error: err.message });
    }
};

// Reset Password (same as before)
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.Password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password has been reset successfully" });
    } catch (err) {
        res.status(500).json({ message: "Reset failed", error: err.message });
    }
};