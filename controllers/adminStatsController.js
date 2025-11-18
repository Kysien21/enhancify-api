const User = require('../models/User');
const bcrypt = require('bcrypt');

// ===================== OVERVIEW / HOME =====================
exports.getOverviewStats = async (req, res) => {
  try {
    // Count only non-admin users
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' }, isActive: true });
    
    // You'll need to create models for these or adjust based on your schema
    // For now, returning placeholder values
    const totalResumes = 0; // await Resume.countDocuments();
    const averageMatchScore = 0; // Calculate from your results collection
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalResumes,
        averageMatchScore
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview stats',
      error: error.message
    });
  }
};

exports.getSystemActivityGraph = async (req, res) => {
  try {
    // This should fetch monthly activity data
    // For now, returning sample data for 12 months
    const monthlyData = Array(12).fill(0);
    
    // TODO: Implement actual query to count activities per month
    // Example:
    // const results = await Analysis.aggregate([
    //   {
    //     $group: {
    //       _id: { $month: "$createdAt" },
    //       count: { $sum: 1 }
    //     }
    //   }
    // ]);
    
    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error fetching system activity graph:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system activity graph',
      error: error.message
    });
  }
};

exports.getRecentAnalyses = async (req, res) => {
  try {
    // TODO: Implement based on your Analysis model
    // This is a placeholder structure
    const recentAnalyses = [];
    
    // Example query (adjust based on your actual models):
    // const recentAnalyses = await Analysis.find()
    //   .populate('userId', 'First_name Last_name')
    //   .sort({ createdAt: -1 })
    //   .limit(10)
    //   .lean();
    
    res.json({
      success: true,
      data: recentAnalyses
    });
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent analyses',
      error: error.message
    });
  }
};

// ===================== REPORTS AND ANALYTICS =====================
exports.getReportsAnalytics = async (req, res) => {
  try {
    // Count only non-admin users
    const totalAnalysis = 0; // await Analysis.countDocuments();
    const avgImprovement = 0; // Calculate from your data
    const activeUsers = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      isActive: true 
    });
    
    res.json({
      success: true,
      data: {
        totalAnalysis,
        avgImprovement,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching reports analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports analytics',
      error: error.message
    });
  }
};

exports.getSystemUsageOverTime = async (req, res) => {
  try {
    // Return monthly usage data
    const usageData = Array(12).fill(0);
    
    res.json({
      success: true,
      data: usageData
    });
  } catch (error) {
    console.error('Error fetching system usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system usage',
      error: error.message
    });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    // Implement monthly statistics
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly stats',
      error: error.message
    });
  }
};

// ===================== USER MANAGEMENT =====================
exports.getUsersList = async (req, res) => {
  try {
    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-Password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();
    
    // Format the data to match your frontend expectations
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: `${user.First_name} ${user.Last_name}`,
      email: user.Email_Address,
      dateJoined: user.firstLogin || user.createdAt,
      totalAnalysis: 0, // TODO: Count from Analysis collection
      isActive: user.isActive
    }));
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users list',
      error: error.message
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-Password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin users'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      data: {
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
};

// ===================== SYSTEM MANAGEMENT =====================
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const adminId = req.session.user._id;
    const admin = await User.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, admin.Password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.Password = hashedPassword;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    const existingUser = await User.findOne({ Email_Address: email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = new User({
      First_name: firstName,
      Last_name: lastName,
      Mobile_No: '00000000000',
      Email_Address: email,
      Password: hashedPassword,
      role: 'admin',
      subscription: {
        isActive: true,
        plan: 'premium'
      }
    });
    
    await newAdmin.save();
    
    res.json({
      success: true,
      message: 'Admin account created successfully'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin account',
      error: error.message
    });
  }
};