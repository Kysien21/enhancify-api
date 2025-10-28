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

         // ✅ Storage size limit (5 MB max)
        const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
        if (file.size > MAX_SIZE) {
            return res.status(400).json({
                success: false,
                message: "File size exceeds 1 MB limit. Please upload a smaller resume (PDF or DOCX)."
            });
        }


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

        // ✅ Add text length limit (e.g., 10,000 characters)
        if (resumeText.length > 10000) {
            return res.status(400).json({
                success: false,
                message: "Resume text exceeds 10,000 character limit. Please upload a shorter resume."
            });
        }

        // Check if its a valid resume
        const resumeKeywords = ["experience", "education", "skills", "projects", "work history", "certifications"];
        const texttocheck = resumeText.toLowerCase();
        const isValidResume = resumeKeywords.some(keyword => texttocheck.includes(keyword));

        if (resumeText.length < 100 || !isValidResume ) {
            return res.status(400).json
            ({
                success: false,
                message: "Uploaded file does not appear to be a valid resume. Please check and try again."
            })
        }


        console.log*("user id sa session:", req.session.user._id);
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