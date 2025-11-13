const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { createPaymentLink } = require('../utils/paymongo');

/**
 * Create a new subscription and generate GCash payment link
 */
exports.createSubscription = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.session.user._id;

        // Validate plan
        if (!['basic', 'premium'].includes(plan)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid plan. Choose "basic" or "premium"' 
            });
        }

        // Check if user already has active subscription
        const user = await User.findById(userId);
        if (user.subscription.isActive) {
            return res.status(400).json({ 
                success: false,
                message: 'You already have an active subscription. Please wait for it to expire before subscribing again.' 
            });
        }

        // Set amount based on plan
        const amount = plan === 'basic' ? 199 : 299; // Basic: ₱199, Premium: ₱299
        const description = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - 1 Month`;

        // Generate PayMongo GCash payment link
        const paymentResult = await createPaymentLink(amount, description, {
            userId: userId.toString(),
            plan
        });

        if (!paymentResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payment link',
                error: paymentResult.error
            });
        }

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

        res.status(201).json({
            success: true,
            message: 'Payment link generated! Complete payment via GCash.',
            data: {
                subscriptionId: subscription._id,
                paymentLink: paymentResult.checkoutUrl,
                amount,
                plan,
                expiresIn: '24 hours'
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
 * Get user's subscription status and history
 */
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        const user = await User.findById(userId).select('subscription');
        const subscriptions = await Subscription.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            currentSubscription: user.subscription,
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
        const { status, plan, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (plan) filter.plan = plan;

        const subscriptions = await Subscription.find(filter)
            .populate('userId', 'username email')
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
 * Admin: Manually approve subscription (for manual payments)
 */
exports.approveSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const adminId = req.session.user._id;

        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days

        // Update subscription
        subscription.status = 'approved';
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.verifiedBy = adminId;
        subscription.verifiedAt = new Date();
        await subscription.save();

        // Update user
        await User.findByIdAndUpdate(subscription.userId, {
            'subscription.plan': subscription.plan,
            'subscription.isActive': true,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate
        });

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