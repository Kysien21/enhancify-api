const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const ExtractedResume = require('../models/ExtractedResume');

exports.uploadResume = async(req, res) => {
    try {
        const file = req.file;
        const jobDescription = req.body.jobDescription;
        console.log("📥 File received:", req.file);
        console.log("📝 Job Desc:", req.body.jobDescription);


        if (!file || !jobDescription) {
            return res.status(400).json({ success: false, message: "Missing file or job description." });
        }

        let resumeText = "";
        let originalFilePath = null;

        // Handle PDF
        if (file.mimetype === "application/pdf") {
            console.log('pdf imong file...');
            const pdfData = await pdfParse(file.buffer); // ✅ buffer supported
            resumeText = pdfData.text.toLowerCase();
            console.log("Extracted Resume Text:\n", resumeText);
        }


        // Handle DOCX
        else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            console.log('docx imong file...');
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            resumeText = result.value;
            originalFilePath = null;
            console.log("Extracted Resume Text:\n", resumeText);

            const lines = resumeText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const uniqueLines = [...new Set(lines)];
            resumeText = uniqueLines.join('\n');

            originalFilePath = null;

            console.log("Extracted Resume Text:\n", resumeText);
        }

        // Unsupported formats
        else if (file.mimetype === "application/msword") {
            console.log('kailangan pdf ra og docx');
            return res.status(400).json({ success: false, message: "DOC format not supported. Use PDF or DOCX." });
        }

        // Save to DB
        const saved = await ExtractedResume.create({
            userId: req.session.user._id,
            resumeText,
            jobDescription,
            originalFile: originalFilePath
        });

        // Delete uploaded file (if applicable)
        if (file.path) {
            fs.unlinkSync(file.path);
        }

        // Send response
        res.status(200).json({
            success: true,
            message: "Upload Successful",
            resumeText,
            resumeId: saved._id // ✅ this allows you to reference it later
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during file upload.",
        });
    }
};