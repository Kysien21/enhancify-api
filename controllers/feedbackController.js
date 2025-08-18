const Feedback = require('../models/Feedback');

// All Feedbacks
exports.getAllUserFeedback = async(req, res) => {
    try {
        const feedback = await Feedback.find({ userId: req.session.user._id }).sort({ createdAt: -1 });
        res.json({ message: 'Your Analytics', feedback });
    } catch (err) {
        console.error('❌ Error getting all feedback:', err);
        res.status(500).json({ message: 'Failed to get feedback' });
    }
};

// Feedback by result ID
exports.getFeedbackByResultId = async(req, res) => {
    try {
        const { resultId } = req.params;
        const feedback = await Feedback.findOne({
            userId: req.session.user._id,
            resultId: resultId,
        });

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        res.json(feedback);
    } catch (err) {
        console.error('❌ Error getting feedback by result ID:', err);
        res.status(500).json({ message: 'Failed to get feedback by result ID' });
    }
};

// Consistency
exports.getConsistencyScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.consistencyAccuracy.consistency) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.consistencyAccuracy.consistency.score });
    } catch (err) {
        console.error("❌ Failed to get consistency score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};

exports.getConsistencyComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.consistencyAccuracy.consistency) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.consistencyAccuracy.consistency.comment });
    } catch (err) {
        console.error("❌ Failed to get consistency feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};

// Spelling and Grammar
exports.getSpellingScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.consistencyAccuracy.spellingGrammar) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.consistencyAccuracy.spellingGrammar.score });
    } catch (err) {
        console.error("❌ Failed to get spelling/grammar score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};

exports.getSpellingComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.consistencyAccuracy.spellingGrammar) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.consistencyAccuracy.spellingGrammar.comment });
    } catch (err) {
        console.error("❌ Failed to get spelling/grammar feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};

// Education Qualification
exports.getQualificationScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.education.qualification) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.education.qualification.score });
    } catch (err) {
        console.error("❌ Failed to get qualification score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};

exports.getQualificationComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.education.qualification) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.education.qualification.comment });
    } catch (err) {
        console.error("❌ Failed to get qualification feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};

// Education Relevance
exports.getRelevanceScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        let score = 0;
        if (
            latest &&
            latest.education &&
            latest.education.relevance &&
            typeof latest.education.relevance.score === 'number'
        ) {
            score = latest.education.relevance.score;
        }

        res.json({ score });
    } catch (err) {
        console.error("❌ Failed to get education relevance score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};


exports.getRelevanceComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        let comment = "No comment";
        if (
            latest &&
            latest.education &&
            latest.education.relevance &&
            typeof latest.education.relevance.comment === 'string'
        ) {
            comment = latest.education.relevance.comment;
        }

        res.json({ comment });
    } catch (err) {
        console.error("❌ Failed to get education relevance feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};


// Experience Work History
exports.getWorkHistoryScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.experience.workHistory) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.experience.workHistory.score });
    } catch (err) {
        console.error("❌ Failed to get work history score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};

exports.getWorkHistoryComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.experience.workHistory) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.experience.workHistory.comment });
    } catch (err) {
        console.error("❌ Failed to get work history feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};

// ✅ Experience Skill Relevance Score
exports.getWorkHistorySkillScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        let score = 0;
        if (
            latest &&
            latest.experience &&
            latest.experience.workHistorySkillMatch &&
            typeof latest.experience.workHistorySkillMatch.score === "number"
        ) {
            score = latest.experience.workHistorySkillMatch.score;
        }

        res.json({ score });
    } catch (err) {
        console.error("❌ Failed to get work history skill score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};

// ✅ Experience Skill Relevance Comment
exports.getWorkHistorySkillComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        let comment = "No comment";
        if (
            latest &&
            latest.experience &&
            latest.experience.workHistorySkillMatch &&
            typeof latest.experience.workHistorySkillMatch.comment === "string"
        ) {
            comment = latest.experience.workHistorySkillMatch.comment;
        }

        res.json({ comment });
    } catch (err) {
        console.error("❌ Failed to get work history skill feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};



// Relevance to Job - Keyword Match
exports.getKeywordMatchScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.relevanceToJob.keywordMatch) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.relevanceToJob.keywordMatch.score });
    } catch (err) {
        console.error("❌ Failed to get keyword match score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};


exports.getKeywordMatchComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.relevanceToJob.keywordMatch) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.relevanceToJob.keywordMatch.comment });
    } catch (err) {
        console.error("❌ Failed to get keyword match feedback:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};


// Relevance to Job - Skill Match
exports.getSkillMatchScore = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.relevanceToJob.skillMatch) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ score: latest.relevanceToJob.skillMatch.score });
    } catch (err) {
        console.error("❌ Failed to get skill match score:", err);
        res.status(500).json({ message: "Error getting score" });
    }
};


exports.getSkillMatchComment = async(req, res) => {
    try {
        const latest = await Feedback.findOne({ userId: req.session.user._id }).sort({ createdAt: -1 });

        if (!latest || !latest.relevanceToJob || !latest.relevanceToJob.skillMatch) {
            return res.status(404).json({ message: 'No feedback found yet' });
        }

        res.json({ comment: latest.relevanceToJob.skillMatch.comment });
    } catch (err) {
        console.error("❌ Failed to get skill match comment:", err);
        res.status(500).json({ message: "Error getting feedback" });
    }
};