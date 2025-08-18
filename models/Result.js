const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    resumeText: { type: String, required: true },
    optimizedResume: { type: String, required: false }, //ge false ky bisag layo ra kaayu sa description mo hatag ghapon og optimized version
    jobDescription: { type: String, required: true },
    overallScore: { type: Number, required: true },
    sectionScores: {
        RelevanceToJob: Number,
        Experience: Number,
        Education: Number,
        ConsistencyAccuracy: Number
    },
    missingSkills: [String],
    missingPhrases: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);

//ibalhin ni sa feedback