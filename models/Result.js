// models/Result.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeText: { type: String, required: true },
    optimizedResume: { type: String, required: false },
    jobDescription: { type: String, required: true },
    category: { type: String, required: true },
    
    // Scoring fields
    overallScore: { type: Number, required: true },
    jobMatchScore: { type: Number, required: false }, // ✅ NEW
    sectionScores: {
        RelevanceToJob: Number,
        Experience: Number,
        Education: Number,
        ConsistencyAccuracy: Number
    },
    
    // Feedback fields
    missingSkills: [String],
    missingPhrases: [String],
    
    // Optimization status
    isOptimized: { type: Boolean, default: false }, // ✅ NEW
    
    // History tracking
    savedToHistory: { type: Boolean, default: false }, // ✅ NEW
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
resultSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Result', resultSchema);