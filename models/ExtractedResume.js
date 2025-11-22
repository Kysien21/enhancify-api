const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const extractedResumeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    resumeText: String,
    jobDescription: String,
    // ✅ REMOVED: category field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExtractedResume', extractedResumeSchema);