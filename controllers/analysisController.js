require("dotenv").config();
const { Anthropic } = require("@anthropic-ai/sdk");

const ResumeOptimizeResult = require("../models/ResumeOptmizeResult");

const {
  AI_CONFIG,
  RESUME_OPTIMIZATION_PROMPT,
} = require("../config/aiPrompts");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const normalizeCertifications = (certifications) => {
  if (!certifications) return "";

  if (Array.isArray(certifications)) {
    const filtered = certifications.filter(
      (cert) =>
        cert &&
        cert.trim() !== "" &&
        !cert.toLowerCase().includes("n/a") &&
        !cert.toLowerCase().includes("none") &&
        !cert.toLowerCase().includes("to be added"),
    );
    return filtered.length > 0 ? filtered.join(" • ") : "";
  }

  const certStr = certifications.toString().trim();
  const placeholders = [
    "n/a",
    "none",
    "to be added",
    "placeholder",
    "null",
    "undefined",
  ];

  if (placeholders.some((p) => certStr.toLowerCase().includes(p))) {
    return "";
  }

  return certStr || "";
};

const normalizeLinkedIn = (linkedin) => {
  if (!linkedin) return "";

  const linkedinStr = linkedin.toString().trim().toLowerCase();
  const placeholders = ["n/a", "none", "to be added", "placeholder", "null"];

  if (placeholders.some((p) => linkedinStr.includes(p)) || linkedinStr === "") {
    return "";
  }

  return linkedin;
};

exports.analyzeResumeInitial = async (req, res) => {
  const { resumeText, jobDescription, resumeId } = req.body;

  if (!resumeText) {
    return res.status(400).json({
      message: "Resume text is required.",
    });
  }

  if (!jobDescription || jobDescription.trim() === "") {
    return res.status(400).json({
      message: "Job description is required.",
    });
  }

  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  try {
    const prompt = RESUME_OPTIMIZATION_PROMPT(
      resumeText,
      jobDescription.trim(),
    );

    console.log("🧠 Calling Claude API for resume analysis and optimization...");
    console.log("👤 User:", req.session.user.email);

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.initialAnalysis.maxTokens,
      temperature: AI_CONFIG.initialAnalysis.temperature,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    if (response.usage) {
      console.log("📊 Claude Token Usage:");
      console.log(" - Input Tokens:", response.usage.input_tokens);
      console.log(" - Output Tokens:", response.usage.output_tokens);
      console.log(
        " - Total Cost: ~$",
        (
          (response.usage.input_tokens * 0.003 +
            response.usage.output_tokens * 0.015) /
          1000
        ).toFixed(4),
      );
    }

    const resultText = response.content[0].text;
    const sanitized = resultText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(sanitized);
      console.log("✅ Successfully parsed JSON response");
      console.log(
        "📈 ATS Score - Original:",
        parsedResult.atsScore?.original,
        "Enhanced:",
        parsedResult.atsScore?.enhanced,
      );

      if (parsedResult.enhancedResume) {
        parsedResult.enhancedResume.certifications = normalizeCertifications(
          parsedResult.enhancedResume.certifications,
        );

        if (parsedResult.enhancedResume.contact) {
          parsedResult.enhancedResume.contact.linkedin = normalizeLinkedIn(
            parsedResult.enhancedResume.contact.linkedin,
          );
        }

        console.log(
          "🔍 Certifications after normalization:",
          parsedResult.enhancedResume.certifications === ""
            ? "NONE (empty string)"
            : parsedResult.enhancedResume.certifications,
        );
      }
    } catch (error) {
      console.error("❌ JSON Parse Error:", error.message);
      console.error("📄 Raw response:", sanitized.substring(0, 500));
      return res.status(500).json({
        message: "Failed to parse AI response",
        error: error.message,
      });
    }

    const savedResult = await ResumeOptimizeResult.create({
      ...parsedResult,
      userId: req.session.user._id,
      originalResumeId: resumeId,
    });

    console.log("💾 Result saved to database with ID:", savedResult._id);

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.API_URL
        : `http://localhost:${process.env.PORT || 3000}`;

    // ✅ FIX: Merge PDF URLs into the analysis object so the frontend
    // can access them via analysisData.originalResume.fileUrl
    // and analysisData.enhancedResume.optimizedPdfUrl
    const analysisWithUrls = {
      ...parsedResult,
      originalResume: {
        ...parsedResult.originalResume,
        fileUrl: `${baseUrl}/api/original-pdf/${resumeId}`,
      },
      enhancedResume: {
        ...parsedResult.enhancedResume,
        optimizedPdfUrl: `${baseUrl}/api/download/${savedResult._id}`,
      },
    };

    return res.status(200).json({
      success: true,
      message: "✅ Resume analyzed and optimized for job posting",
      analysis: analysisWithUrls,
      resultId: savedResult._id,
    });
  } catch (error) {
    console.error("❌ Analysis Error:", error.message);

    if (error.status === 429) {
      return res.status(429).json({
        message: "Rate limit exceeded. Please try again in a moment.",
        error: "Too many requests",
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        message: "API authentication failed. Please check your API key.",
        error: "Invalid API key",
      });
    }

    res.status(500).json({
      message: "Analysis failed",
      error: error.message,
    });
  }
};

exports.optimizeResume = async (req, res) => {
  console.log(
    "⚠️ optimizeResume endpoint called - This is now handled in analyzeResumeInitial",
  );

  return res.status(400).json({
    success: false,
    message:
      "This endpoint is deprecated. Resume optimization now happens during initial analysis.",
    redirectTo: "/analyze-initial",
  });
};

exports.updateOptimizedResume = async (req, res) => {
  console.log(
    "⚠️ updateOptimizedResume endpoint called - This endpoint is deprecated",
  );

  return res.status(400).json({
    success: false,
    message: "This endpoint is deprecated.",
  });
};

exports.analyzeResume = exports.analyzeResumeInitial;

module.exports = exports;