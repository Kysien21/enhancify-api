const User = require('../models/User');
const ResumeOptimizeResult = require('../models/ResumeOptmizeResult');
const bcrypt = require('bcrypt');

// ===================== OVERVIEW / HOME =====================
exports.getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      isActive: true 
    });
    
    const totalResumes = await ResumeOptimizeResult.countDocuments();
    
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
    const monthlyData = await ResumeOptimizeResult.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const result = Array(12).fill(0);
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

// ✅ NEW: Get Department Statistics
exports.getDepartmentStats = async (req, res) => {
  try {
    console.log("📊 Fetching department statistics...");

    // ✅ Map category names to department codes
    const categoryToDepartment = {
      'Information Technology': 'CIT',
      'Engineering': 'CIT',
      'Business Administration': 'CBA',
      'Education': 'CTE',
      'Arts and Sciences': 'CAS',
      'Criminal Justice': 'CCJE',
      'Healthcare': 'CAS',
      'Marketing': 'CBA',
      'Finance': 'CBA',
      'Human Resources': 'CBA',
      'Sales': 'CBA',
      'Customer Service': 'CAS',
      'Other': 'CAS',
      // Also handle if someone directly used dept codes
      'CIT': 'CIT',
      'CBA': 'CBA',
      'CTE': 'CTE',
      'CAS': 'CAS',
      'CCJE': 'CCJE'
    };

    // Get all users with their categories
    const users = await User.find({ 
      role: 'user',
      isActive: true 
    }).select('category');

    // Initialize department counts
    const departmentCounts = {
      'CIT': 0,
      'CBA': 0,
      'CTE': 0,
      'CAS': 0,
      'CCJE': 0,
      'HM': 0
    };

    // Count users by department
    users.forEach(user => {
      if (user.category) {
        // Map the category to department
        const dept = categoryToDepartment[user.category] || user.category;
        
        if (departmentCounts.hasOwnProperty(dept)) {
          departmentCounts[dept]++;
        }
      }
    });

    // Convert to array in correct order
    const departmentData = [
      departmentCounts['CIT'],
      departmentCounts['CBA'],
      departmentCounts['CTE'],
      departmentCounts['CAS'],
      departmentCounts['CCJE'],
      departmentCounts['HM']
    ];

    console.log("📊 Department Stats:", departmentData);

    res.json({
      success: true,
      data: departmentData
    });
  } catch (error) {
    console.error("❌ Error fetching department stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department statistics"
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
    
    await User.findByIdAndDelete(userId);
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

exports.getTokenUsageGraph = async (req, res) => {
  try {
    const TOKENS_PER_ANALYSIS = 5000; // Average tokens per resume analysis
    
    // Get current month data
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get daily token usage for current month
    const dailyData = await ResumeOptimizeResult.aggregate([
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
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const result = Array(daysInMonth).fill(0);
    
    // Calculate tokens per day
    dailyData.forEach(item => {
      result[item._id - 1] = item.count * TOKENS_PER_ANALYSIS;
    });
    
    res.json({
      success: true,
      data: result,
      month: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }),
      year: currentYear,
      tokensPerAnalysis: TOKENS_PER_ANALYSIS
    });
  } catch (error) {
    console.error('Error fetching token usage graph:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token usage graph',
      error: error.message
    });
  }
};