const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    plan: {
        type: String,
        enum: ['premium'], // ✅ Only premium needs payment
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'PHP'
    },
    paymentMethod: {
        type: String,
        enum: ['gcash'],
        default: 'gcash'
    },
    
    // ✅ PayMongo/GCash payment details
    paymentLink: String,
    paymentLinkId: String,
    gcashReference: String,
    gcashTransactionId: String,
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'expired', 'cancelled'],
        default: 'pending'
    },
    
    // Subscription period
    startDate: Date,
    endDate: Date,
    
    // Admin verification (optional for manual approval)
    verifiedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    verifiedAt: Date,
    
    // Metadata
    notes: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update timestamp on save
subscriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);