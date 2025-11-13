const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result' },
    action: { type: String, default: 'resume_optimization' },
    description: String,
    
    // ❌ Remove: resumeText (original)
    optimizedResume: { type: String, required: true }, // ✅ Only optimized
    jobDescription: String,
    
    // Scores
    overallScore: Number,
    jobMatchScore: Number,
    
    // Metadata
    category: String,
    timestamp: { type: Date, default: Date.now }
});

// const historySchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   resumeText: String,
//   jobDescription: String,
//   overallScore: Number,
//   feedback: String,
//   createdAt: { type: Date, default: Date.now }
// });

module.exports = mongoose.model('History', historySchema);