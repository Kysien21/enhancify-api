const axios = require('axios');

/**
 * Create PayMongo GCash payment link
 * @param {number} amount - Amount in PHP (e.g., 299)
 * @param {string} description - Payment description
 * @param {object} metadata - Additional data (userId, plan)
 * @returns {object} { success, checkoutUrl, paymentLinkId, error }
 */
exports.createPaymentLink = async (amount, description, metadata) => {
    try {
        const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
        
        if (!PAYMONGO_SECRET_KEY) {
            throw new Error('PAYMONGO_SECRET_KEY not configured in .env');
        }

        // PayMongo expects amount in centavos (multiply by 100)
        const amountInCentavos = amount * 100;

        const payload = {
            data: {
                attributes: {
                    amount: amountInCentavos,
                    description: description,
                    remarks: `Enhancify Premium - User: ${metadata.userId}`,
                    payment_method_types: ['gcash'], // GCash only
                    payment_method_options: {
                        gcash: {
                            success_url: `${process.env.CLIENT_URL}/subscription/success`,
                            cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`
                        }
                    },
                    metadata: {
                        userId: metadata.userId,
                        plan: metadata.plan
                    }
                }
            }
        };

        console.log('📤 Creating PayMongo payment link...');
        console.log('Amount:', amount, 'PHP');

        const response = await axios.post(
            'https://api.paymongo.com/v1/links',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`
                }
            }
        );

        const paymentData = response.data.data;
        
        return {
            success: true,
            checkoutUrl: paymentData.attributes.checkout_url,
            paymentLinkId: paymentData.id,
            referenceNumber: paymentData.attributes.reference_number
        };

    } catch (error) {
        console.error('❌ PayMongo API Error:', error.response?.data || error.message);
        
        return {
            success: false,
            error: error.response?.data?.errors?.[0]?.detail || error.message
        };
    }
};

/**
 * Retrieve payment link status
 * @param {string} linkId - PayMongo link ID
 */
exports.getPaymentLinkStatus = async (linkId) => {
    try {
        const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

        const response = await axios.get(
            `https://api.paymongo.com/v1/links/${linkId}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`
                }
            }
        );

        return {
            success: true,
            data: response.data.data
        };

    } catch (error) {
        console.error('❌ Get payment link error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};