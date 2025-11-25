const User = require('../models/User');
const ResumeOptimizeResult = require('../models/ResumeOptmizeResult');
const bcrypt = require('bcrypt');

// ===================== OVERVIEW / HOME =====================
exports.getOverviewStats = async (req, res) => {
  try {
    // Count only non-admin active users
    const totalUsers = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      isActive: true 
    });
    
    // ✅ Count total optimized resumes (changed key to match frontend)
    const totalResumes = await ResumeOptimizeResult.countDocuments();
    
    // ✅ Calculate average ATS score from enhanced resumes
    const scoreStats = await ResumeOptimizeResult.aggregate([
      {
        $group: {
          _id: null,
          avgEnhancedScore: { $avg: '$atsScore.enhanced' }
        }
      }
    ]);
    
    const averageMatchScore = scoreStats.length > 0 
      ? Math.round(scoreStats[0].avgEnhancedScore) 
      : 0;
    
    console.log('📊 Overview Stats:', { totalUsers, totalResumes, averageMatchScore });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalResumes, // ✅ Changed from totalOptimizedResumes to match frontend
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
    // Get monthly activity data from ResumeOptimizeResult
    const monthlyData = await ResumeOptimizeResult.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Initialize array with 12 months
    const result = Array(12).fill(0);
    
    // Fill in the actual data
    monthlyData.forEach(item => {
      result[item._id - 1] = item.count;
    });
    
    res.json({
      success: true,
      data: result
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
    const recentAnalyses = await ResumeOptimizeResult.find()
      .populate('userId', 'First_name Last_name Email_Address')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Format the data
    const formatted = recentAnalyses.map(analysis => ({
      _id: analysis._id,
      userName: analysis.userId ? 
        `${analysis.userId.First_name} ${analysis.userId.Last_name}` : 
        'Unknown User',
      userEmail: analysis.userId?.Email_Address || 'N/A',
      originalScore: analysis.atsScore?.original || 0,
      enhancedScore: analysis.atsScore?.enhanced || 0,
      createdAt: analysis.createdAt
    }));
    
    res.json({
      success: true,
      data: formatted
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
    const totalAnalysis = await ResumeOptimizeResult.countDocuments();
    
    // Calculate average improvement
    const improvementStats = await ResumeOptimizeResult.aggregate([
      {
        $project: {
          improvement: { 
            $subtract: ['$atsScore.enhanced', '$atsScore.original'] 
          }
        }
      },
      {
        $group: {
          _id: null,
          avgImprovement: { $avg: '$improvement' }
        }
      }
    ]);
    
    const avgImprovement = improvementStats.length > 0 
      ? Math.round(improvementStats[0].avgImprovement) 
      : 0;
    
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
    const usageData = await ResumeOptimizeResult.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const result = Array(12).fill(0);
    usageData.forEach(item => {
      result[item._id - 1] = item.count;
    });
    
    res.json({
      success: true,
      data: result
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
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const stats = await ResumeOptimizeResult.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$createdAt" }, currentMonth] },
              { $eq: [{ $year: "$createdAt" }, currentYear] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgScore: { $avg: '$atsScore.enhanced' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats.length > 0 ? stats[0] : { count: 0, avgScore: 0 }
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
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-Password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get analysis count for each user
    const usersWithAnalysis = await Promise.all(
      users.map(async (user) => {
        const analysisCount = await ResumeOptimizeResult.countDocuments({ 
          userId: user._id 
        });
        
        return {
          _id: user._id,
          username: `${user.First_name} ${user.Last_name}`,
          email: user.Email_Address,
          dateJoined: user.firstLogin || user.createdAt,
          totalAnalysis: analysisCount,
          isActive: user.isActive
        };
      })
    );
    
    res.json({
      success: true,
      data: usersWithAnalysis
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
    
    // ✅ Permanently delete the user
    await User.findByIdAndDelete(userId);
    
    // ✅ Also delete all their resume optimization results
    await ResumeOptimizeResult.deleteMany({ userId });
    
    console.log(`✅ User deleted: ${user.Email_Address}`);
    
    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
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
    
    // ✅ Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();
    
    console.log(`✅ User ${user.isActive ? 'unblocked' : 'blocked'}: ${user.Email_Address}`);
    
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

// ✅ REMOVED: createAdmin function - only one admin exists via script