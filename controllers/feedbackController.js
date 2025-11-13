const Feedback = require('../models/Feedback');

// Get all feedback entries for the logged-in user
exports.getAllUserFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ userId: req.session.user._id }).sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        console.error('❌ Error fetching all feedback:', error);
        res.status(500).json({ message: 'Failed to retrieve feedbacks' });
    }
};

// Get feedback by resultId
exports.getFeedbackByResultId = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({
            userId: req.session.user._id,
            resultId: req.params.resultId
        });

        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json(feedback);
    } catch (error) {
        console.error('❌ Error fetching feedback by resultId:', error);
        res.status(500).json({ message: 'Error retrieving feedback' });
    }
};

// Individual fields (optional APIs)
exports.getATSScore = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ resultId: req.params.resultId });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json({ atsCompatibilityScore: feedback.atsCompatibilityScore });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ATS score' });
    }
};

exports.getReadabilityScore = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ resultId: req.params.resultId });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json({ readabilityScore: feedback.readabilityScore });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching readability score' });
    }
};

exports.getBriefSummary = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ resultId: req.params.resultId });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json({ briefSummary: feedback.briefSummary });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brief summary' });
    }
};
