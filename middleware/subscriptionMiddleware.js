const User = require('../models/User');

/**
 * Check usage limits based on plan
 * - Freemium: 1 optimization per day
 * - Premium: Unlimited
 */
exports.checkUsageLimit = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // ✅ Check if subscription expired
        if (user.subscription.isActive && user.subscription.endDate) {
            const now = new Date();
            const endDate = new Date(user.subscription.endDate);

            if (now > endDate) {
                // Subscription expired - revert to freemium
                user.subscription.isActive = false;
                user.subscription.plan = 'freemium';
                await user.save();
                
                console.log('⏰ Subscription expired for user:', userId);
            }
        }

        // ✅ Premium users: Unlimited access
        if (user.subscription.isActive && user.subscription.plan === 'premium') {
            return next();
        }

        // ✅ Freemium users: 1 optimization per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastUsed = user.subscription.lastUsedDate 
            ? new Date(user.subscription.lastUsedDate) 
            : null;

        // Check if user already used today
        if (lastUsed && lastUsed >= today) {
            return res.status(403).json({
                success: false,
                message: 'Daily limit reached (1 optimization per day)',
                currentPlan: 'freemium',
                suggestion: 'Upgrade to Premium for unlimited optimizations',
                upgradeRequired: true
            });
        }

        // ✅ Update last used date
        user.subscription.lastUsedDate = new Date();
        user.subscription.usageCount = (user.subscription.usageCount || 0) + 1;
        await user.save();

        // Add usage info to request
        req.usageInfo = {
            plan: 'freemium',
            usedToday: true,
            remainingToday: 0
        };

        next();

    } catch (error) {
        console.error('❌ Usage limit check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking usage limit',
            error: error.message
        });
    }
};

/**
 * Check if user has active subscription
 */
exports.requireSubscription = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if subscription is active
        if (!user.subscription.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Premium subscription required',
                currentPlan: 'freemium',
                subscriptionRequired: true
            });
        }

        // Check if subscription has expired
        if (user.subscription.endDate && new Date() > user.subscription.endDate) {
            user.subscription.isActive = false;
            user.subscription.plan = 'freemium';
            await user.save();

            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired',
                subscriptionExpired: true
            });
        }

        next();

    } catch (error) {
        console.error('❌ Subscription check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking subscription',
            error: error.message
        });
    }
};

module.exports = exports;