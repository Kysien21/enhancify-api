const fs = require('fs');
const Result = require('../models/Result');
const path = require('path');
const Resume = require('../models/ExtractedResume');

// GET: List all results for the logged-in user
exports.getresults = async(req, res) => {
    try {
        const results = await Result.find({ userId: req.session.user._id }); // use session
        res.json({ message: "Results retrieved", results });
    } catch (err) {
        console.error('Error getting results:', err);
        res.status(500).json({ message: "Failed to get results" });
    }
};

// GET /api/score – Get latest resume analysis score for logged-in user
exports.getscore = async(req, res) => {
    try {
        const userId = req.session.user._id; // ✅ correct variable name
        console.log("user id", userId); // ✅ FIXED: it was 'userid' before (wrong)

        const latestResult = await Result.findOne({ userId }).sort({ createdAt: -1 });

        if (!latestResult) {
            return res.status(404).json({ message: 'No resume score found' });
        }

        res.json({
            overallScore: latestResult.overallScore,
            sectionScores: latestResult.sectionScores
        });
    } catch (error) {
        console.error('Error fetching score:', error);
        res.status(500).json({ message: 'Server error while fetching score' });
    }
};



// exports.confirmAndDeleteOriginal = async(req, res) => {
//     const { resumeId } = req.body;

//     try {
//         // extracted resume entry
//         const resume = await Resume.findById(resumeId);
//         if (!resume) {
//             return res.status(404).json({ message: 'Resume not found' });
//         }

//         // original file delete
//         if (resume.originalFile) {
//             const filePath = path.join(__dirname, '..', resume.originalFile);
//             if (fs.existsSync(filePath)) {
//                 fs.unlinkSync(filePath); // delete actual file
//             }
//         }

//         // Delete the extracted resume document (text, jobDesc, filePath)
//         await Resume.findByIdAndDelete(resumeId); //  remove from DB

//         // Respond with success
//         res.json({ message: '✅ Original resume and extracted data deleted after confirmation' });

//     } catch (err) {
//         console.error('Error during confirmation cleanup:', err);
//         res.status(500).json({ message: '❌ Failed to delete original resume and extracted data' });
//     }
// };



// const { Document, Packer, Paragraph, TextRun } = require("docx");
// const PDFDocument = require("pdfkit");

// exports.downloadOptimized = async(req, res) => {
//     const { resumeId } = req.params; // Get resumeId from the route param (/result/:resumeId)
//     const format = req.query.format || "pdf"; // Optional format query (?format=pdf or ?format=docx)

//     try {
//         // Find the optimized resume result in the database
//         const result = await Result.findById(resumeId);
//         if (!result) {
//             return res.status(404).json({ message: "Result not found" });
//         }

//         // Get the optimized resume text
//         const content = result.optimizedResume || "No optimized resume found.";

//         // GENERATE PDF VERSION
//         if (format === "pdf") {
//             const doc = new PDFDocument(); // Create PDF document
//             res.setHeader("Content-Type", "application/pdf"); // Set proper content type
//             res.setHeader("Content-Disposition", "attachment; filename=optimized_resume.pdf"); // Force download
//             doc.pipe(res); // Pipe PDF to response stream
//             doc.font("Times-Roman").fontSize(12).text(content); // Add resume content to PDF
//             doc.end(); // Finalize the PDF output
//         }

//         // GENERATE DOCX VERSION
//         else if (format === "docx") {
//             // Create a new Word document with the resume content
//             const doc = new Document({
//                 sections: [{
//                     children: [new Paragraph({
//                         children: [new TextRun(content)],
//                     })],
//                 }],
//             });

//             // Generate the document as a buffer
//             const buffer = await Packer.toBuffer(doc);

//             // Set headers for Word file download
//             res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//             res.setHeader("Content-Disposition", "attachment; filename=optimized_resume.docx");

//             // Send the file as a response
//             res.send(buffer);
//         } else {
//             res.status(400).json({
//                 message: "Invalid format. Use ?format=pdf or ?format=docx"
//             });
//         }

//     } catch (error) {
//         console.error("Download error:", error);
//         res.status(500).json({ message: "Error generating file" });
//     }
// };

const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

exports.downloadOptimized = async(req, res) => {
    try {
        const { resumeId } = req.params;
        const { format } = req.query;

        // Fetch result (optimized content)
        const result = await Result.findOne({ _id: resumeId, userId: req.session.user._id });
        if (!result) return res.status(404).json({ error: 'Result not found' });

        // Fetch resume (for deleting original file)
        const resume = await Resume.findOne({ userId: req.session.user._id });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        const optimizedText = result.optimizedResume || result.feedback || 'No optimized content found.';

        // 🔥 Delete physical file if it exists
        if (resume.originalFile) {
            const filePath = path.join(__dirname, '..', resume.originalFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log("✅ Deleted original file:", resume.originalFile);
            }
        }

        // 🔥 Remove the DB record of the uploaded resume
        await Resume.findOneAndDelete({ userId: req.session.user._id });

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


exports.getOriginalResume = async(req, res) => {
    try {
        const result = await Result.findOne({ userId: req.session.user._id })
            .sort({ createdAt: -1 });

        if (!result) {
            return res.status(404).json({ message: "Original resume not found." });
        }

        res.json({ original: result.resumeText });
    } catch (err) {
        console.error("Error fetching original resume:", err);
        res.status(500).json({ message: "Failed to get original resume." });
    }
};


exports.getOptimizedResume = async(req, res) => {
    try {
        const result = await Result.findOne({ userId: req.session.user._id })
            .sort({ createdAt: -1 });

        if (!result) {
            return res.status(404).json({ message: "Optimized resume not found." });
        }

        res.json({ resume: result.optimizedResume });
    } catch (err) {
        console.error("Error fetching optimized resume:", err);
        res.status(500).json({ message: "Failed to get optimized resume." });
    }
};


// const History = require('../models/History');

// exports.saveHistory = async (req, res) => {
//   try {
//     const { resumeText, jobDescription, overallScore, feedback } = req.body;
//     const userId = req.session.user._id; // or req.user._id if using JWT

//     const history = new History({
//       userId,
//       resumeText,
//       jobDescription,
//       overallScore,
//       feedback
//     });

//     await history.save();
//     res.status(200).json({ message: '✅ History saved!' });
//   } catch (err) {
//     console.error('❌ Error saving history:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };