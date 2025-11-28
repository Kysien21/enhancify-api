const User = require('../models/User');
const bcrypt = require('bcrypt');

// ==================== GET USER PROFILE ====================
/**
 * Get current user's profile information
 * GET /api/v1/user/profile
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    const user = await User.findById(userId).select('-Password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        firstName: user.First_name,
        lastName: user.Last_name,
        email: user.Email_Address,
        mobile: user.Mobile_No,
        username: user.username || `@${user.First_name.toLowerCase()}_${user._id.toString().slice(-5)}`,
        profilePicture: user.profilePicture || null,
        loginCount: user.loginCount,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// ==================== UPDATE USER PROFILE ====================
/**
 * Update user profile information
 * PUT /api/v1/user/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { firstName, lastName, mobile } = req.body;
    
    // Validation
    if (!firstName || !lastName || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and mobile are required'
      });
    }
    
    // Validate mobile number (11-15 digits)
    if (mobile.length < 11 || mobile.length > 15 || !/^\d+$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be 11-15 digits'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    user.First_name = firstName;
    user.Last_name = lastName;
    user.Mobile_No = mobile;
    
    await user.save();
    
    // Update session
    req.session.user.firstName = firstName;
    
    console.log('✅ Profile updated for:', user.Email_Address);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        firstName: user.First_name,
        lastName: user.Last_name,
        mobile: user.Mobile_No
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// ==================== UPDATE PASSWORD ====================
/**
 * Update user password
 * PUT /api/v1/user/password
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated for:', user.Email_Address);
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

// ==================== DELETE ACCOUNT ====================
/**
 * Delete user account (soft delete - set isActive to false)
 * DELETE /api/v1/user/account
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { password, confirmDelete } = req.body;
    
    // Validation
    if (!password || !confirmDelete) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation required'
      });
    }
    
    if (confirmDelete !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type DELETE to confirm'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.Password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    
    // Clear cookie
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    console.log('✅ Account deleted for:', user.Email_Address);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  deleteAccount
};