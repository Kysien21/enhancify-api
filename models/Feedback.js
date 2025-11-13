const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result', required: true },

    // ✅ These are the new fields you added
    atsCompatibilityScore: 
    { 
        type: Number, 
        required: true 
    },
    readabilityScore: 
    { 
        type: Number, 
        required: true }
        ,
    briefSummary:
     { 
        type: String, 
        required: true 
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
