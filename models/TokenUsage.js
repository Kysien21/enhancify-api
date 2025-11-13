const mongoose = require('mongoose');

const tokenUsageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    operation: { 
        type: String, 
        enum: ['initial_analysis', 'optimization'], 
        required: true 
    },
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number,
    model: String,
    cost: Number, // Optional: calculate cost
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TokenUsage', tokenUsageSchema);