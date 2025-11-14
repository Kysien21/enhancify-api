const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    First_name: {
        type: String,
        trim: true
    },
    Last_name: {
        type: String,
        trim: true
    },
    Mobile_No: {
        type: String,
        trim: true
    },
    Email_Address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    Password: {
        type: String
    },

    // ✅ Login tracking
    loginCount: {
        type: Number,
        default: 0
    },
    firstLogin: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date,
    
    // ✅ OAuth fields
    googleId: String,
    facebookId: String,
    username: String,
    profilePicture: String,
    
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    // ✅ UPDATED Subscription fields
    subscription: {
        isActive: { 
            type: Boolean, 
            default: false 
        },
        plan: { 
            type: String, 
            enum: ['freemium', 'premium'], // ✅ Changed from 'free' to 'freemium'
            default: 'freemium' 
        },
        startDate: Date,
        endDate: Date,
        transactionId: String,
        gcashReference: String,
        
        // ✅ NEW: Daily usage tracking for freemium
        lastUsedDate: Date,
        usageCount: {
            type: Number,
            default: 0
        }
    },
    
    // Forgot password fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    // Activity tracking
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);