const User = require('../models/User');

// Check if user has active subscription
exports.requireSubscription = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if subscription is active and not expired
        if (!user.subscription.isActive) {
            return res.status(403).json({
                message: 'Subscription required. Please subscribe to continue.',
                subscriptionRequired: true
            });
        }

        // Check if subscription has expired
        if (user.subscription.endDate && new Date() > user.subscription.endDate) {
            // Automatically deactivate expired subscription
            user.subscription.isActive = false;
            await user.save();

            return res.status(403).json({
                message: 'Your subscription has expired. Please renew to continue.',
                subscriptionExpired: true
            });
        }

        // Subscription is valid, proceed
        next();

    } catch (error) {
        console.error('❌ Subscription check error:', error);
        res.status(500).json({
            message: 'Error checking subscription status',
            error: error.message
        });
    }
};

// Check if user has specific plan
exports.requirePlan = (requiredPlan) => {
    return async (req, res, next) => {
        try {
            const userId = req.session.user._id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Free plan always allowed
            if (requiredPlan === 'free') {
                return next();
            }

            // Check subscription
            if (!user.subscription.isActive) {
                return res.status(403).json({
                    message: `${requiredPlan} plan required`,
                    currentPlan: 'free',
                    requiredPlan
                });
            }

            // Check if expired
            if (user.subscription.endDate && new Date() > user.subscription.endDate) {
                user.subscription.isActive = false;
                await user.save();

                return res.status(403).json({
                    message: 'Your subscription has expired',
                    subscriptionExpired: true
                });
            }

            // Check plan hierarchy (premium > basic)
            const planHierarchy = { free: 0, basic: 1, premium: 2 };
            
            if (planHierarchy[user.subscription.plan] < planHierarchy[requiredPlan]) {
                return res.status(403).json({
                    message: `This feature requires ${requiredPlan} plan`,
                    currentPlan: user.subscription.plan,
                    requiredPlan
                });
            }

            next();

        } catch (error) {
            console.error('❌ Plan check error:', error);
            res.status(500).json({
                message: 'Error checking plan',
                error: error.message
            });
        }
    };
};

// Check usage limits (for free/basic plans)
exports.checkUsageLimit = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Premium users have unlimited access
        if (user.subscription.isActive && user.subscription.plan === 'premium') {
            return next();
        }

        // Count user's analyses this month
        const Result = require('../models/Result');
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const analysisCount = await Result.countDocuments({
            userId,
            createdAt: { $gte: startOfMonth }
        });

        // Set limits
        let limit = 3; // Free users: 3 per month
        if (user.subscription.isActive && user.subscription.plan === 'basic') {
            limit = 10; // Basic users: 10 per month
        }

        if (analysisCount >= limit) {
            return res.status(403).json({
                message: `Monthly limit reached (${limit} analyses)`,
                currentCount: analysisCount,
                limit,
                suggestion: user.subscription.plan === 'free' 
                    ? 'Upgrade to Basic or Premium for more analyses'
                    : 'Upgrade to Premium for unlimited analyses'
            });
        }

        // Add usage info to request
        req.usageInfo = {
            count: analysisCount,
            limit,
            remaining: limit - analysisCount
        };

        next();

    } catch (error) {
        console.error('❌ Usage limit check error:', error);
        res.status(500).json({
            message: 'Error checking usage limit',
            error: error.message
        });
    }
};

module.exports = exports;