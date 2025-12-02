const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const ExtractedResume = require("../models/ExtractedResume");

exports.uploadResume = async (req, res) => {
  try {
    const file = req.file;
    const { jobDescription } = req.body; // ✅ Now optional

    console.log("📥 File received:", req.file);
    console.log("📝 Job Desc:", jobDescription || "Not provided");

    // ✅ Validation - Only file is required now
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required.",
      });
    }

    // ✅ Storage size limit (1 MB max)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message:
          "File size exceeds 1 MB limit. Please upload a smaller resume (PDF or DOCX).",
      });
    }

    let resumeText = "";
    let originalFilePath = null;

    // Handle PDF
    if (file.mimetype === "application/pdf") {
      console.log("📄 Processing PDF file...");
      const pdfData = await pdfParse(file.buffer);
      resumeText = pdfData.text.toLowerCase();
    }
    // Handle DOCX
    else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log("📝 Processing DOCX file...");
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      resumeText = result.value;

      // Remove duplicate lines
      const lines = resumeText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const uniqueLines = [...new Set(lines)];
      resumeText = uniqueLines.join("\n");
    }
    // Unsupported formats
    else if (file.mimetype === "application/msword") {
      return res.status(400).json({
        success: false,
        message: "DOC format not supported. Use PDF or DOCX.",
      });
    }

    // ✅ Text length limit
    if (resumeText.length > 10000) {
      return res.status(400).json({
        success: false,
        message:
          "Resume text exceeds 10,000 character limit. Please upload a shorter resume.",
      });
    }

    // ✅ Validate resume content
    const resumeKeywords = [
      "experience",
      "education",
      "skills",
      "projects",
      "work history",
      "certifications",
    ];
    const textToCheck = resumeText.toLowerCase();
    const isValidResume = resumeKeywords.some((keyword) =>
      textToCheck.includes(keyword)
    );

    if (resumeText.length < 100 || !isValidResume) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded file does not appear to be a valid resume. Please check and try again.",
      });
    }

    console.log("👤 User ID from session:", req.session.user._id);

    // ✅ Save to DB - jobDescription is now optional
    const saved = await ExtractedResume.create({
      userId: req.session.user._id,
      resumeText,
      jobDescription: jobDescription || "", // ✅ Default to empty string if not provided
      originalFile: originalFilePath,
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
      resumeId: saved._id,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload.",
      error: error.message,
    });
  }
};
