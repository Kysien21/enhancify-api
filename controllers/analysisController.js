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

/**
 * Analyze and optimize resume
 * This is the main function that processes the uploaded resume
 * ✅ Job description is now OPTIONAL
 */
exports.analyzeResumeInitial = async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  // ✅ Validate required fields - only resumeText is required now
  if (!resumeText) {
    return res.status(400).json({ 
      message: "Resume text is required." 
    });
  }

  // Check user session
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  try {
    // ✅ Get the prompt with resume and optional job description
    const prompt = RESUME_OPTIMIZATION_PROMPT(
      resumeText, 
      jobDescription || "" // Pass empty string if no job description
    );

    console.log("🧠 Calling Claude API for resume analysis and optimization...");
    console.log("👤 User:", req.session.user.email);
    console.log("📝 Job Description:", jobDescription ? "Provided" : "Not provided (general optimization)");

    // Call Claude AI API
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

    // Log token usage
    if (response.usage) {
      console.log("📊 Claude Token Usage:");
      console.log(" - Input Tokens:", response.usage.input_tokens);
      console.log(" - Output Tokens:", response.usage.output_tokens);
      console.log(" - Total Cost: ~$", ((response.usage.input_tokens * 0.003 + response.usage.output_tokens * 0.015) / 1000).toFixed(4));
    }

    // Extract and clean the response
    const resultText = response.content[0].text;
    const sanitized = resultText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(sanitized);
      console.log("✅ Successfully parsed JSON response");
      console.log("📈 ATS Score - Original:", parsedResult.atsScore?.original, "Enhanced:", parsedResult.atsScore?.enhanced);
    } catch (error) {
      console.error("❌ JSON Parse Error:", error.message);
      console.error("📄 Raw response:", sanitized.substring(0, 500));
      return res.status(500).json({
        message: "Failed to parse AI response",
        error: error.message,
      });
    }

    // Save result to database
    const savedResult = await ResumeOptimizeResult.create({
      ...parsedResult,
      userId: req.session.user._id,
    });

    console.log("💾 Result saved to database with ID:", savedResult._id);

    // Send success response
    return res.status(200).json({
      success: true,
      message: jobDescription 
        ? "✅ Resume analyzed and optimized for job posting" 
        : "✅ Resume analyzed and optimized (general)",
      analysis: parsedResult,
      resultId: savedResult._id,
    });

  } catch (error) {
    console.error("❌ Analysis Error:", error.message);
    
    // Handle specific API errors
    if (error.status === 429) {
      return res.status(429).json({ 
        message: "Rate limit exceeded. Please try again in a moment.",
        error: "Too many requests" 
      });
    }
    
    if (error.status === 401) {
      return res.status(500).json({ 
        message: "API authentication failed. Please check your API key.",
        error: "Invalid API key" 
      });
    }

    res.status(500).json({ 
      message: "Analysis failed", 
      error: error.message 
    });
  }
};

/**
 * Optimize resume (Deprecated - kept for backward compatibility)
 * The optimization now happens in analyzeResumeInitial
 */
exports.optimizeResume = async (req, res) => {
  console.log("⚠️ optimizeResume endpoint called - This is now handled in analyzeResumeInitial");
  
  return res.status(400).json({
    success: false,
    message: "This endpoint is deprecated. Resume optimization now happens during initial analysis.",
    redirectTo: "/analyze-initial"
  });
};

/**
 * Update optimized resume (Deprecated - kept for backward compatibility)
 */
exports.updateOptimizedResume = async (req, res) => {
  console.log("⚠️ updateOptimizedResume endpoint called - This endpoint is deprecated");
  
  return res.status(400).json({
    success: false,
    message: "This endpoint is deprecated."
  });
};

/**
 * Backward compatibility alias
 * Routes using /analyze will work the same as /analyze-initial
 */
exports.analyzeResume = exports.analyzeResumeInitial;

module.exports = exports;