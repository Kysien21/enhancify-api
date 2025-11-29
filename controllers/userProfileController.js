const User = require('../models/User');
const bcrypt = require('bcrypt');

// ==================== GET USER PROFILE ====================
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
        category: user.category, // ✅ Return category instead of mobile
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
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { firstName, lastName, category } = req.body; // ✅ Changed from mobile to category
    
    // ✅ Updated validation
    if (!firstName || !lastName || !category) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and category are required'
      });
    }
    
    // ✅ Validate category
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

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // ✅ Update fields
    user.First_name = firstName;
    user.Last_name = lastName;
    user.category = category; // ✅ Update category instead of mobile
    
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
        category: user.category
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
const updatePassword = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
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
    
    if (newPassword.length < 10) { // ✅ Match frontend validation
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 10 characters long'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
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
const deleteAccount = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { password, confirmDelete } = req.body;
    
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
    
    const isMatch = await bcrypt.compare(password, user.Password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    user.isActive = false;
    await user.save();
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    
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