const ExtractedResume = require('../models/ExtractedResume');

const uploadRateLimiter = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user._id;
    
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentUploads = await ExtractedResume.countDocuments({
      userId: userId,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    console.log(`📊 User uploads in last 24h: ${recentUploads}/2`);

    if (recentUploads >= 2) {
      const oldestUpload = await ExtractedResume
        .findOne({ userId: userId, createdAt: { $gte: twentyFourHoursAgo } })
        .sort({ createdAt: 1 });

      if (oldestUpload) {
        const resetTime = new Date(oldestUpload.createdAt);
        resetTime.setHours(resetTime.getHours() + 24);
        
        const hoursLeft = Math.ceil((resetTime - new Date()) / (1000 * 60 * 60));

        return res.status(429).json({
          success: false,
          message: `Upload limit reached. You can upload again in ${hoursLeft} hour(s).`,
          resetAt: resetTime.toISOString()
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ Upload rate limiter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking upload limit'
    });
  }
};

module.exports = uploadRateLimiter;