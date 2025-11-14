const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { createPaymentLink } = require('../utils/paymongo');

/**
 * Create Premium subscription and generate GCash payment link
 */
exports.createSubscription = async (req, res) => {
    try {
        const userId = req.session.user._id;

        // Check if user already has active premium subscription
        const user = await User.findById(userId);
        
        if (user.subscription.isActive && user.subscription.plan === 'premium') {
            const endDate = new Date(user.subscription.endDate);
            return res.status(400).json({ 
                success: false,
                message: `You already have an active premium subscription until ${endDate.toLocaleDateString()}`
            });
        }

        // ✅ Premium plan only - ₱299/month
        const plan = 'premium';
        const amount = 299;
        const description = 'Premium Plan - Unlimited Resume Optimizations (30 Days)';

        console.log('🔄 Creating payment link for user:', userId);

        // Generate PayMongo GCash payment link
        const paymentResult = await createPaymentLink(amount, description, {
            userId: userId.toString(),
            plan: plan
        });

        if (!paymentResult.success) {
            console.error('❌ PayMongo error:', paymentResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payment link. Please try again.',
                error: paymentResult.error
            });
        }

        console.log('✅ Payment link created:', paymentResult.checkoutUrl);

        // Create subscription record
        const subscription = await Subscription.create({
            userId,
            plan,
            amount,
            paymentMethod: 'gcash',
            paymentLink: paymentResult.checkoutUrl,
            paymentLinkId: paymentResult.paymentLinkId,
            status: 'pending'
        });

        console.log('✅ Subscription record created:', subscription._id);

        res.status(201).json({
            success: true,
            message: 'Payment link generated! Complete payment via GCash to activate Premium.',
            data: {
                subscriptionId: subscription._id,
                paymentLink: paymentResult.checkoutUrl,
                amount: 299,
                plan: 'premium',
                features: [
                    'Unlimited resume optimizations',
                    'No daily limits',
                    'Priority support',
                    'Valid for 30 days'
                ]
            }
        });

    } catch (error) {
        console.error('❌ Create subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create subscription',
            error: error.message 
        });
    }
};

/**
 * Get user's current subscription status
 */
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        const user = await User.findById(userId).select('subscription');
        
        // Get recent subscription history
        const subscriptions = await Subscription.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate days remaining
        let daysRemaining = 0;
        if (user.subscription.isActive && user.subscription.endDate) {
            const now = new Date();
            const end = new Date(user.subscription.endDate);
            const diff = end - now;
            daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        res.json({
            success: true,
            currentSubscription: {
                plan: user.subscription.plan,
                isActive: user.subscription.isActive,
                startDate: user.subscription.startDate,
                endDate: user.subscription.endDate,
                daysRemaining,
                dailyLimitUsed: user.subscription.plan === 'freemium' ? 
                    (user.subscription.lastUsedDate ? 
                        new Date(user.subscription.lastUsedDate).toDateString() === new Date().toDateString() 
                        : false) 
                    : null
            },
            history: subscriptions
        });

    } catch (error) {
        console.error('❌ Get subscription status error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get subscription status',
            error: error.message 
        });
    }
};

/**
 * Cancel a pending subscription
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const userId = req.session.user._id;

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId,
            status: 'pending'
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found or cannot be cancelled'
            });
        }

        subscription.status = 'cancelled';
        await subscription.save();

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });

    } catch (error) {
        console.error('❌ Cancel subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to cancel subscription',
            error: error.message 
        });
    }
};

/**
 * Admin: Get all subscriptions
 */
exports.getAllSubscriptions = async (req, res) => {
    try {
        // Check if user is admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const subscriptions = await Subscription.find(filter)
            .populate('userId', 'First_name Last_name Email_Address')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Subscription.countDocuments(filter);

        res.json({
            success: true,
            subscriptions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Get all subscriptions error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get subscriptions',
            error: error.message 
        });
    }
};

/**
 * Admin: Manually approve subscription
 */
exports.approveSubscription = async (req, res) => {
    try {
        // Check if user is admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { subscriptionId } = req.params;
        const adminId = req.session.user._id;

        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Calculate dates (30 days)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Update subscription
        subscription.status = 'approved';
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.verifiedBy = adminId;
        subscription.verifiedAt = new Date();
        await subscription.save();

        // Update user
        await User.findByIdAndUpdate(subscription.userId, {
            'subscription.plan': 'premium',
            'subscription.isActive': true,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate
        });

        console.log('✅ Subscription manually approved by admin');

        res.json({
            success: true,
            message: 'Subscription approved successfully',
            subscription
        });

    } catch (error) {
        console.error('❌ Approve subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to approve subscription',
            error: error.message 
        });
    }
};

module.exports = exports;