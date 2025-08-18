const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result' }, // ✅ Link to Result document

    relevanceToJob: {
        skillMatch: {
            score: Number,
            comment: String
        },
        keywordMatch: {
            score: Number,
            comment: String
        }
    },

    experience: {
        workHistory: {
            score: Number,
            comment: String
        },
        workHistorySkillMatch: {
            score: Number,
            comment: String
        }
    },

    education: {
        qualification: {
            score: Number,
            comment: String
        },
        relevance: {
            score: Number,
            comment: String
        }
    },

    consistencyAccuracy: {
        spellingGrammar: {
            score: Number,
            comment: String
        },
        consistency: {
            score: Number,
            comment: String
        }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);