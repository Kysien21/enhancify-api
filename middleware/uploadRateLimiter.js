const ExtractedResume = require('../models/ExtractedResume');

/**
 * Rate limiter for file uploads
 * Allows 2 uploads per user per 7 days (1 week)
 */
const uploadRateLimiter = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user._id;
    
    // Get uploads from last 7 days (1 week)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await ExtractedResume.countDocuments({
      userId: userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    console.log(`📊 User ${req.session.user.email} uploads in last 7 days: ${recentUploads}/2`);

    // Check if limit exceeded
    if (recentUploads >= 2) {
      // Get the oldest upload to calculate when they can upload again
      const oldestUpload = await ExtractedResume
        .findOne({ 
          userId: userId,
          createdAt: { $gte: sevenDaysAgo }
        })
        .sort({ createdAt: 1 })
        .select('createdAt');

      if (oldestUpload) {
        const resetTime = new Date(oldestUpload.createdAt);
        resetTime.setDate(resetTime.getDate() + 7); // Add 7 days
        
        const daysLeft = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60));

        return res.status(429).json({
          success: false,
          message: `Upload limit reached. You can upload again in ${daysLeft} day(s).`,
          limit: 2,
          remaining: 0,
          resetAt: resetTime.toISOString(),
          daysUntilReset: daysLeft,
          hoursUntilReset: hoursLeft
        });
      }
    }

    // Allow upload
    console.log(`✅ Upload allowed for user ${req.session.user.email}`);
    next();

  } catch (error) {
    console.error('❌ Upload rate limiter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking upload limit',
      error: error.message
    });
  }
};

module.exports = uploadRateLimiter;