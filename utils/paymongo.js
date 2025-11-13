const axios = require('axios');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

if (!PAYMONGO_SECRET_KEY) {
    console.error('❌ PAYMONGO_SECRET_KEY is not set in .env file!');
}

// Create axios instance with PayMongo config
const paymongoAPI = axios.create({
    baseURL: 'https://api.paymongo.com/v1',
    headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Create a GCash payment link
 * @param {number} amount - Amount in PHP (e.g., 299)
 * @param {string} description - Payment description
 * @param {Object} metadata - Additional data (userId, plan, etc.)
 * @returns {Promise<Object>} - Payment link details
 */
exports.createPaymentLink = async (amount, description, metadata = {}) => {
    try {
        const response = await paymongoAPI.post('/links', {
            data: {
                attributes: {
                    amount: amount * 100, // Convert to centavos
                    description: description,
                    remarks: metadata.remarks || 'Subscription Payment',
                    payment_method_allowed: ['gcash'],
                    payment_method_types: ['gcash']
                }
            }
        });

        return {
            success: true,
            checkoutUrl: response.data.data.attributes.checkout_url,
            referenceNumber: response.data.data.id,
            paymentLinkId: response.data.data.id
        };
    } catch (error) {
        console.error('❌ PayMongo Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.errors || error.message
        };
    }
};

/**
 * Retrieve payment link details
 * @param {string} linkId - Payment link ID
 * @returns {Promise<Object>} - Payment details
 */
exports.getPaymentLink = async (linkId) => {
    try {
        const response = await paymongoAPI.get(`/links/${linkId}`);
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('❌ Get Payment Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.errors || error.message
        };
    }
};

/**
 * Check if payment is completed
 * @param {string} linkId - Payment link ID
 * @returns {Promise<boolean>} - True if paid
 */
exports.isPaymentCompleted = async (linkId) => {
    try {
        const result = await exports.getPaymentLink(linkId);
        if (result.success) {
            return result.data.attributes.status === 'paid';
        }
        return false;
    } catch (error) {
        console.error('❌ Payment status check error:', error);
        return false;
    }
};

module.exports = exports;