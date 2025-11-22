const fs = require('fs');
const Result = require('../models/Result');
const History = require('../models/History');
const path = require('path');
const Resume = require('../models/ExtractedResume');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// GET: List all results for the logged-in user
exports.getresults = async(req, res) => {
    try {
        const results = await Result.find({ userId: req.session.user._id })
            .sort({ createdAt: -1 });
        res.json({ message: "Results retrieved", results });
    } catch (err) {
        console.error('Error getting results:', err);
        res.status(500).json({ message: "Failed to get results" });
    }
};

// GET: Get specific result by ID
exports.getResultById = async(req, res) => {
    try {
        const { resultId } = req.params;
        const result = await Result.findOne({ 
            _id: resultId, 
            userId: req.session.user._id 
        });

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        res.json({ success: true, result });
    } catch (err) {
        console.error('Error getting result:', err);
        res.status(500).json({ message: "Failed to get result" });
    }
};

// GET: Latest resume analysis score
exports.getscore = async(req, res) => {
    try {
        const userId = req.session.user._id;
        console.log("user id", userId);

        const latestResult = await Result.findOne({ userId }).sort({ createdAt: -1 });

        if (!latestResult) {
            return res.status(404).json({ message: 'No resume score found' });
        }

        res.json({
            overallScore: latestResult.overallScore,
            jobMatchScore: latestResult.jobMatchScore,
            sectionScores: latestResult.sectionScores
        });
    } catch (error) {
        console.error('Error fetching score:', error);
        res.status(500).json({ message: 'Server error while fetching score' });
    }
};

// GET: Original resume
exports.getOriginalResume = async(req, res) => {
    try {
        const { resultId } = req.params;
        const result = await Result.findOne({ 
            _id: resultId,
            userId: req.session.user._id 
        });

        if (!result) {
            return res.status(404).json({ message: "Original resume not found." });
        }

        res.json({ success: true, original: result.resumeText });
    } catch (err) {
        console.error("Error fetching original resume:", err);
        res.status(500).json({ message: "Failed to get original resume." });
    }
};

// GET: Optimized resume
exports.getOptimizedResume = async(req, res) => {
    try {
        const { resultId } = req.params;
        const result = await Result.findOne({ 
            _id: resultId,
            userId: req.session.user._id 
        });

        if (!result) {
            return res.status(404).json({ message: "Result not found." });
        }

        if (!result.optimizedResume) {
            return res.status(404).json({ message: "Resume not optimized yet." });
        }

        res.json({ 
            success: true, 
            optimized: result.optimizedResume,
            isOptimized: result.isOptimized 
        });
    } catch (err) {
        console.error("Error fetching optimized resume:", err);
        res.status(500).json({ message: "Failed to get optimized resume." });
    }
};

// POST: Save to history
exports.saveToHistory = async(req, res) => {
    try {
        const { resultId } = req.body;
        const userId = req.session.user._id;

        const result = await Result.findOne({ _id: resultId, userId });

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        // ✅ Check if resume is optimized
        if (!result.isOptimized || !result.optimizedResume) {
            return res.status(400).json({ 
                message: "Please optimize the resume before saving to history" 
            });
        }

        // ✅ Check if already saved
        if (result.savedToHistory) {
            return res.status(400).json({ message: "Already saved to history" });
        }

        // ✅ Create history entry with ONLY optimized version (no category)
        await History.create({
            userId,
            action: 'resume_optimization',
            description: `Optimized resume - Score: ${result.overallScore}`,
            resultId: result._id,
            optimizedResume: result.optimizedResume,
            jobDescription: result.jobDescription,
            overallScore: result.overallScore,
            jobMatchScore: result.jobMatchScore,
            // ✅ REMOVED: category field
            timestamp: new Date()
        });

        result.savedToHistory = true;
        await result.save();

        res.json({
            success: true,
            message: "✅ Optimized resume saved to history"
        });

    } catch (error) {
        console.error("❌ Save to history error:", error);
        res.status(500).json({ message: "Failed to save to history" });
    }
};

// GET: Download optimized resume (PDF or DOCX)
exports.downloadOptimized = async(req, res) => {
    try {
        const { resultId } = req.params;
        const { format } = req.query;

        // Fetch result
        const result = await Result.findOne({ _id: resultId, userId: req.session.user._id });
        if (!result) return res.status(404).json({ error: 'Result not found' });

        if (!result.optimizedResume) {
            return res.status(400).json({ error: 'Resume not optimized yet' });
        }

        const optimizedText = result.optimizedResume;

        // 🔥 Delete original uploaded file if exists
        const resume = await Resume.findOne({ userId: req.session.user._id });
        if (resume && resume.originalFile) {
            const filePath = path.join(__dirname, '..', resume.originalFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log("✅ Deleted original file:", resume.originalFile);
            }
        }

        // === DOCX FORMAT ===
        if (format === 'docx') {
            const doc = new Document({
                sections: [{
                    children: [new Paragraph({ children: [new TextRun(optimizedText)] })],
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            res.setHeader('Content-Disposition', 'attachment; filename=optimized_resume.docx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            return res.send(buffer);
        }

        // === DEFAULT: PDF FORMAT ===
        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', 'attachment; filename=optimized_resume.pdf');
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);
        doc.font('Times-Roman').fontSize(12).text(optimizedText);
        doc.end();

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download resume' });
    }
};

module.exports = exports;