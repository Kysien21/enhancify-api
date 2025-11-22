const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result' },
    action: { type: String, default: 'resume_optimization' },
    description: String,
    
    optimizedResume: { type: String, required: true },
    jobDescription: String,
    
    // Scores
    overallScore: Number,
    jobMatchScore: Number,
    
    // ✅ REMOVED: category field
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);