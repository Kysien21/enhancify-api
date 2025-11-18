const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    First_name: { type: String, required: true },
    Last_name: { type: String, required: true },
    Mobile_No: { type: String, required: true },
    Email_Address: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    role: { type: String, enum: ['user','admin'], default: 'user' },
    loginCount: { type: Number, default: 0 },
    firstLogin: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    subscription: {
        isActive: { type: Boolean, default: false },
        plan: { type: String, default: 'free' }
    },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

module.exports = mongoose.model('User', userSchema);
