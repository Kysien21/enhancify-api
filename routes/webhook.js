const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');

/**
 * PayMongo Webhook Handler
 * Automatically activates premium subscription after GCash payment
 */
router.post('/paymongo', express.json({ type: '*/*' }), async (req, res) => {
    try {
        console.log('📨 Webhook received from PayMongo');
        console.log('Event data:', JSON.stringify(req.body, null, 2));

        const event = req.body.data;

        // ✅ Handle successful GCash payment
        if (event.attributes.type === 'link.payment.paid') {
            const linkId = event.attributes.data.attributes.link_id;
            
            console.log('💰 Payment completed for link:', linkId);

            // Find subscription by payment link ID
            const subscription = await Subscription.findOne({ 
                paymentLinkId: linkId,
                status: 'pending'
            });

            if (!subscription) {
                console.log('⚠️ Subscription not found for payment link:', linkId);
                return res.sendStatus(200);
            }

            // Calculate subscription period (30 days)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            // Update subscription record
            subscription.status = 'approved';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.gcashReference = event.attributes.data.id;
            await subscription.save();

            // ✅ Activate premium subscription for user
            await User.findByIdAndUpdate(subscription.userId, {
                'subscription.plan': 'premium',
                'subscription.isActive': true,
                'subscription.startDate': startDate,
                'subscription.endDate': endDate,
                'subscription.gcashReference': event.attributes.data.id
            });

            console.log('✅ Premium subscription activated!');
            console.log('   User ID:', subscription.userId);
            console.log('   Plan: Premium (Unlimited)');
            console.log('   Valid until:', endDate.toLocaleDateString());
            console.log('   GCash Ref:', event.attributes.data.id);
        }

        // Always return 200 to acknowledge receipt
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.sendStatus(500);
    }
});

module.exports = router;