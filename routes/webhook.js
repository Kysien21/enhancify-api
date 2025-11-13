const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');

/**
 * PayMongo Webhook Handler
 * Receives payment notifications from PayMongo
 */
router.post('/paymongo', express.json({ type: '*/*' }), async (req, res) => {
    try {
        console.log('📨 Webhook received from PayMongo');
        console.log('Event data:', JSON.stringify(req.body, null, 2));

        const event = req.body.data;

        // Handle successful payment
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

            // Calculate dates (30 days subscription)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            // Update subscription record
            subscription.status = 'approved';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.gcashReference = event.attributes.data.id;
            await subscription.save();

            // Update user subscription
            await User.findByIdAndUpdate(subscription.userId, {
                'subscription.plan': subscription.plan,
                'subscription.isActive': true,
                'subscription.startDate': startDate,
                'subscription.endDate': endDate
            });

            console.log('✅ Subscription activated!');
            console.log('   User ID:', subscription.userId);
            console.log('   Plan:', subscription.plan);
            console.log('   Valid until:', endDate.toLocaleDateString());
        }

        // Always return 200 to acknowledge receipt
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.sendStatus(500);
    }
});

module.exports = router;