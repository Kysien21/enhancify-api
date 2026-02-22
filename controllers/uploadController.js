const fs = require("fs");
const path = require("path");
const { createWorker } = require("tesseract.js");
const pdf = require("pdf-parse");
const ExtractedResume = require("../models/ExtractedResume");

/**
 * Convert PDF to text using OCR (for scanned PDFs) or direct extraction (for text PDFs)
 */
const performOCR = async (pdfBuffer) => {
  try {
    console.log("🔍 Starting PDF text extraction...");

    // First, try to extract text directly from PDF
    const pdfData = await pdf(pdfBuffer);
    let extractedText = pdfData.text.trim();

    // If PDF has selectable text, use that
    if (extractedText.length > 100) {
      console.log("✅ PDF has selectable text, using direct extraction");
      return extractedText;
    }

    console.log("📸 PDF appears to be scanned, using OCR...");

    // For scanned PDFs, we need to use OCR
    const worker = await createWorker("eng");

    try {
      console.log("🖼️ Processing PDF with OCR...");

      const {
        data: { text },
      } = await worker.recognize(pdfBuffer);

      await worker.terminate();

      console.log("✅ OCR completed, extracted", text.length, "characters");
      return text;
    } catch (ocrError) {
      await worker.terminate();
      throw ocrError;
    }
  } catch (error) {
    console.error("❌ OCR Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

exports.uploadResume = async (req, res) => {
  try {
    const file = req.file;
    const { jobDescription } = req.body;

    console.log("📥 File received:", req.file?.originalname);
    console.log("📝 Job Desc:", jobDescription || "Not provided");

    // ✅ Validation - BOTH file and job description are required
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required.",
      });
    }

    // ✅ NEW: Job description is now REQUIRED
    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Job description is required.",
      });
    }

    // ✅ Only accept PDF files
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are accepted. Please upload a PDF resume.",
      });
    }

    // ✅ File size limit (5 MB max for PDF with OCR)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message:
          "File size exceeds 5 MB limit. Please upload a smaller resume.",
      });
    }

    console.log("📄 Processing PDF file...");

    // ✅ Perform OCR/text extraction on PDF
    let resumeText = await performOCR(file.buffer);

    // Clean up text
    resumeText = resumeText
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    // ✅ Text length validation
    if (resumeText.length > 15000) {
      return res.status(400).json({
        success: false,
        message:
          "Resume text exceeds 15,000 character limit. Please upload a shorter resume.",
      });
    }

    // ✅ Validate resume content
    const resumeKeywords = [
      "experience",
      "education",
      "skills",
      "projects",
      "work",
      "employment",
      "qualification",
      "certification",
    ];

    const textToCheck = resumeText.toLowerCase();
    const isValidResume = resumeKeywords.some((keyword) =>
      textToCheck.includes(keyword)
    );

    if (resumeText.length < 100 || !isValidResume) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded PDF does not appear to be a valid resume. Please check and try again.",
      });
    }

    console.log("👤 User ID from session:", req.session.user._id);
    console.log("✅ Extracted text length:", resumeText.length, "characters");

    // ✅ Save PDF file to uploads directory
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${req.session.user._id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Save PDF file
    fs.writeFileSync(filePath, file.buffer);
    console.log("💾 PDF saved to:", filePath);

    // ✅ Save to DB - jobDescription is now required
    const saved = await ExtractedResume.create({
      userId: req.session.user._id,
      resumeText,
      jobDescription: jobDescription.trim(), // ✅ Remove || ""
      originalFile: `uploads/${fileName}`,
      fileType: "pdf",
    });

    console.log("✅ Resume data saved to database");

    // Send response
    res.status(200).json({
      success: true,
      message: "PDF Upload and OCR Successful",
      resumeText,
      resumeId: saved._id,
      fileName: fileName,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during PDF upload and OCR processing.",
      error: error.message,
    });
  }
};