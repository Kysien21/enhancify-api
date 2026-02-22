const fs = require("fs");
const path = require("path");
const Result = require("../models/Result");
const History = require("../models/History");
const Resume = require("../models/ExtractedResume");
const ResumeOptimizeResult = require("../models/ResumeOptmizeResult");
const PDFDocument = require("pdfkit");

// GET: List all results for the logged-in user
exports.getresults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.session.user._id }).sort({
      createdAt: -1,
    });
    res.json({ message: "Results retrieved", results });
  } catch (err) {
    console.error("Error getting results:", err);
    res.status(500).json({ message: "Failed to get results" });
  }
};

// GET: Get specific result by ID
exports.getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findOne({
      _id: resultId,
      userId: req.session.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error("Error getting result:", err);
    res.status(500).json({ message: "Failed to get result" });
  }
};

// GET: Latest resume analysis score
exports.getscore = async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log("user id", userId);

    const latestResult = await Result.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!latestResult) {
      return res.status(404).json({ message: "No resume score found" });
    }

    res.json({
      overallScore: latestResult.overallScore,
      jobMatchScore: latestResult.jobMatchScore,
      sectionScores: latestResult.sectionScores,
    });
  } catch (error) {
    console.error("Error fetching score:", error);
    res.status(500).json({ message: "Server error while fetching score" });
  }
};

// GET: Original resume
exports.getOriginalResume = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findOne({
      _id: resultId,
      userId: req.session.user._id,
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
exports.getOptimizedResume = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findOne({
      _id: resultId,
      userId: req.session.user._id,
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
      isOptimized: result.isOptimized,
    });
  } catch (err) {
    console.error("Error fetching optimized resume:", err);
    res.status(500).json({ message: "Failed to get optimized resume." });
  }
};

// POST: Save to history
exports.saveToHistory = async (req, res) => {
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
        message: "Please optimize the resume before saving to history",
      });
    }

    // ✅ Check if already saved
    if (result.savedToHistory) {
      return res.status(400).json({ message: "Already saved to history" });
    }

    // ✅ Create history entry with ONLY optimized version
    await History.create({
      userId,
      action: "resume_optimization",
      description: `Optimized resume - Score: ${result.overallScore}`,
      resultId: result._id,
      optimizedResume: result.optimizedResume,
      jobDescription: result.jobDescription,
      overallScore: result.overallScore,
      jobMatchScore: result.jobMatchScore,
      timestamp: new Date(),
    });

    result.savedToHistory = true;
    await result.save();

    res.json({
      success: true,
      message: "✅ Optimized resume saved to history",
    });
  } catch (error) {
    console.error("❌ Save to history error:", error);
    res.status(500).json({ message: "Failed to save to history" });
  }
};

// ✅ Download optimized resume as PDF ONLY
exports.downloadOptimized = async (req, res) => {
  try {
    const { resultId } = req.params;

    console.log("📥 PDF Download request for:", resultId);

    // ✅ Fetch from ResumeOptimizeResult model
    const result = await ResumeOptimizeResult.findOne({
      _id: resultId,
      userId: req.session.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    const enhanced = result.enhancedResume;

    if (!enhanced) {
      return res.status(400).json({
        success: false,
        message: "Enhanced resume not found",
      });
    }

    // ✅ Generate PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "LETTER",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=optimized-resume-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // === CONTACT SECTION ===
    doc.fontSize(22).font("Helvetica-Bold").text(enhanced.contact.name, {
      align: "center",
    });

    doc.moveDown(0.3);

    const contactLine = [
      enhanced.contact.email,
      enhanced.contact.phone,
      enhanced.contact.location,
    ]
      .filter(Boolean)
      .join(" | ");

    doc.fontSize(10).font("Helvetica").text(contactLine, {
      align: "center",
    });

    if (enhanced.contact.linkedin) {
      doc.fontSize(10).text(enhanced.contact.linkedin, {
        align: "center",
        link: enhanced.contact.linkedin,
        underline: true,
        color: "blue",
      });
    }

    doc.moveDown(1.5);

    // === SUMMARY ===
    if (enhanced.summary) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PROFESSIONAL SUMMARY", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(enhanced.summary, {
        align: "justify",
        lineGap: 2,
      });
      doc.moveDown(1.2);
    }

    // === EXPERIENCE ===
    if (enhanced.experience && enhanced.experience.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("WORK EXPERIENCE", { underline: true });
      doc.moveDown(0.5);

      enhanced.experience.forEach((exp, index) => {
        doc.fontSize(12).font("Helvetica-Bold").text(exp.position);
        doc
          .fontSize(10)
          .font("Helvetica-Oblique")
          .text(`${exp.company} | ${exp.period}`);
        doc.moveDown(0.3);

        exp.responsibilities.forEach((resp) => {
          doc.fontSize(10).font("Helvetica").text(`• ${resp}`, {
            indent: 20,
            align: "justify",
            lineGap: 1,
          });
          doc.moveDown(0.2);
        });

        if (index < enhanced.experience.length - 1) {
          doc.moveDown(0.8);
        }
      });

      doc.moveDown(1.2);
    }

    // === EDUCATION ===
    if (enhanced.education && enhanced.education.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("EDUCATION", { underline: true });
      doc.moveDown(0.5);

      enhanced.education.forEach((edu) => {
        doc.fontSize(11).font("Helvetica-Bold").text(edu.degree);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`${edu.institution} | ${edu.period}`);

        if (edu.relevant) {
          doc
            .fontSize(9)
            .font("Helvetica-Oblique")
            .text(`Relevant Coursework: ${edu.relevant}`, {
              indent: 20,
            });
        }
        doc.moveDown(0.6);
      });

      doc.moveDown(0.8);
    }

    // === SKILLS ===
    if (enhanced.skills) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("SKILLS", { underline: true });
      doc.moveDown(0.5);

      if (enhanced.skills.technical && enhanced.skills.technical.length > 0) {
        doc.fontSize(11).font("Helvetica-Bold").text("Technical Skills:");
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(enhanced.skills.technical.join(" • "), {
            indent: 20,
            lineGap: 1,
          });
        doc.moveDown(0.4);
      }

      if (enhanced.skills.soft && enhanced.skills.soft.length > 0) {
        doc.fontSize(11).font("Helvetica-Bold").text("Soft Skills:");
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(enhanced.skills.soft.join(" • "), {
            indent: 20,
            lineGap: 1,
          });
        doc.moveDown(0.4);
      }

      doc.moveDown(0.8);
    }

    // === CERTIFICATIONS ===
    if (enhanced.certifications && enhanced.certifications.trim() !== "") {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("CERTIFICATIONS", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(enhanced.certifications, {
        lineGap: 1,
      });
      doc.moveDown(0.8);
    }

    // === LANGUAGES ===
    if (enhanced.languages && enhanced.languages.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("LANGUAGES", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(enhanced.languages.join(" • "));
    }

    doc.end();
    console.log("✅ PDF generated successfully");
  } catch (error) {
    console.error("❌ Download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download resume",
      error: error.message,
    });
  }
};

module.exports = exports;
