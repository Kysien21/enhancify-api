const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const extractedResumeSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    resumeText: { 
        type: String,
        required: true
    },
    jobDescription: { 
        type: String,
        default: "" // ✅ Optional field with default empty string
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('ExtractedResume', extractedResumeSchema);