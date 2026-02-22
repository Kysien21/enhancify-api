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
        required: true, // ✅ Changed from optional to required
        trim: true
    },
    originalFile: {
        type: String, // Path to stored PDF file
        required: false
    },
    fileType: {
        type: String,
        enum: ['pdf'],
        default: 'pdf'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('ExtractedResume', extractedResumeSchema);