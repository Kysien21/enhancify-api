require("dotenv").config();
const { Anthropic } = require("@anthropic-ai/sdk");

const Result = require("../models/Result");
const ResumeOptimizeResult = require("../models/ResumeOptmizeResult");
const Feedback = require("../models/Feedback");
const History = require("../models/History");

const {
  AI_CONFIG,
  getPrompt,
  getMockData,
  shouldUseMock,
  isAICallAllowed,
} = require("../config/aiPrompts");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function removeDuplicateLines(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const uniqueLines = [...new Set(lines)];
  return uniqueLines.join("\n\n");
}

// ✅ Initial analysis after upload (scores only, no optimization yet)
exports.analyzeResumeInitial = async (req, res) => {
  const { resumeText, jobDescription } = req.body; // ✅ Removed category

  if (!resumeText || !jobDescription) {
    return res
      .status(400)
      .json({ message: "Resume and job description required." });
  }

  if (!req.session.user || !resumeText || !jobDescription) {
    return res.status(400).json({ message: "Missing required data." });
  }

  try {
    const prompt = `
          <RESUME_TEXT_VERSION>
          ${resumeText}
          </RESUME_TEXT_VERSION>

          <JOB_DESCRIPTION>
          ${jobDescription}
          </JOB_DESCRIPTION>

You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to analyze the provided resume text and create an enhanced, ATS-optimized version using ONLY the information explicitly present in the original text.

INPUT HANDLING:
- If a job description is provided: Align the resume content to match the job requirements by emphasizing relevant skills, experiences, and keywords from the job posting
- If no job description is provided: Perform general optimization to maximize ATS compatibility across various roles

CRITICAL RULES:
- Work ONLY with the text that has been scanned/extracted from the resume
- DO NOT add any skills, experiences, certifications, or qualifications that are not already present in the original resume
- DO NOT fill gaps or infer missing information
- DO NOT suggest adding new content
- ONLY reorganize, reformat, and optimize the existing content for ATS compatibility
- When a job description is provided, prioritize and emphasize experiences/skills that match the job requirements, but never fabricate new ones
- If information is unclear or incomplete, preserve it as-is rather than inventing details
- Focus on: improving formatting, enhancing keyword placement, optimizing section headers, ensuring ATS-friendly structure, and (if job description provided) strategic emphasis of relevant qualifications

Your optimization should make the scanned content more ATS-friendly without adding ANY new substantive information.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no explanations, no markdown, no preamble, no additional text
2. Do not wrap the JSON in markdown code blocks
3. Follow the exact structure specified below
4. Enhance keywords, improve formatting, and expand content for better ATS compatibility

OPTIMIZATION GUIDELINES:
- Expand job titles for clarity (e.g., "Intern" → "Forestry Intern")
- Expand acronyms in company names for ATS recognition
- Transform basic bullet points into detailed accomplishment statements (2 bullets → 5+ detailed statements)
- Use strong action verbs: Collaborated, Managed, Coordinated, Maintained, Supported, Developed, Implemented, Executed, Led, Optimized
- Include quantifiable metrics where possible (e.g., "100% accuracy", "managed X items", "reduced time by Y%")
- When job description is provided: Mirror relevant keywords and phrases from the posting in appropriate sections
- When job description is provided: Reorder bullet points to highlight job-relevant achievements first
- Add industry-specific keywords relevant to the field (or to the target job if description provided)
- Reorganize skills into Technical and Soft Skills categories, prioritizing job-relevant skills when applicable
- Expand skill lists from generic terms to specific competencies
- Add relevant coursework to education entries
- Format phone numbers with country codes
- Streamline addresses for better readability
- Fix grammatical issues and incomplete sentences
- Calculate realistic ATS scores based on keyword density, formatting quality, content depth, completeness, and (if applicable) alignment with job requirements


          Your response must be a valid JSON object with this exact structure:

          {
            "originalResume": {
              "contact": {
                "name": "string",
                "phone": "string",
                "email": "string",
                "address": "string"
              },
              "summary": "string",
              "experience": [
                {
                  "position": "string",
                  "company": "string",
                  "period": "string",
                  "responsibilities": ["string"]
                }
              ],
              "education": [
                {
                  "institution": "string",
                  "period": "string"
                }
              ],
              "skills": ["string"],
              "languages": ["string"]
            },
            "enhancedResume": {
              "contact": {
                "name": "string",
                "phone": "string with country code",
                "email": "string",
                "location": "string - streamlined address",
                "linkedin": "string - placeholder or actual URL"
              },
              "summary": "string - expanded with industry keywords, quantifiable qualities, and career objectives",
              "experience": [
                {
                  "position": "string - specific job title",
                  "company": "string - full company name with acronym expanded",
                  "period": "string - formatted as Month Year - Month Year",
                  "responsibilities": ["string - action verb statements with metrics and achievements"]
                }
              ],
              "education": [
                {
                  "degree": "string - full degree title",
                  "institution": "string",
                  "period": "string",
                  "relevant": "string - relevant coursework (optional)"
                }
              ],
              "skills": {
                "technical": ["string - specific technical skills"],
                "soft": ["string - specific soft skills"]
              },
              "languages": ["string - language with proficiency level"],
              "certifications": "string - placeholder or actual certifications"
            },
            "improvements": [
              {
                "category": "string",
                "changes": ["string"],
                "impact": "high or critical"
              }
            ],
            "atsScore": {
              "original": number,
              "enhanced": number,
              "categories": [
                {
                  "name": "string",
                  "original": number,
                  "enhanced": number
                }
              ]
            }
          }
    `;

    console.log("🧠 Calling Claude API for initial analysis...");

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

    const resultText = response.content[0].text;

    const sanitize = resultText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(sanitize);
      console.log("✅ Successfully parsed JSON");
    } catch (error) {
      console.error("❌ JSON Parse Error:", error.message);
      return res.status(500).json({
        message: "Failed to parse AI response",
        error: error.message,
      });
    }

    // ✅ Save to database without category
    await ResumeOptimizeResult.create({
      ...parsedResult,
      userId: req.session.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "✅ Resume analyzed successfully",
      analysis: parsedResult,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ message: "Analysis failed", error: error.message });
  }
};

// ✅ Optimize/Enhancify the resume (called when user clicks "Enhancify")
exports.optimizeResume = async (req, res) => {
  const { resultId } = req.body;

  const USE_MOCK = shouldUseMock(req);

  try {
    const result = await Result.findOne({
      _id: resultId,
      userId: req.session.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    if (result.isOptimized && result.optimizedResume) {
      return res.json({
        success: true,
        message: "Resume already optimized",
        optimizedResume: result.optimizedResume,
      });
    }

    const prompt = getPrompt.optimization(
      result.resumeText,
      result.jobDescription,
      result.missingSkills,
      result.missingPhrases
    );

    let optimizedText;

    if (USE_MOCK) {
      optimizedText = getMockData.optimization();
    } else {
      console.log("🧠 Calling Claude API for optimization...");

      const response = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.optimization.maxTokens,
        temperature: AI_CONFIG.optimization.temperature,
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
      optimizedText = response.content[0].text;

      if (response.usage) {
        console.log("📊 Claude Token Usage:");
        console.log(" - Input Tokens:", response.usage.input_tokens);
        console.log(" - Output Tokens:", response.usage.output_tokens);
      }
    }

    optimizedText = removeDuplicateLines(optimizedText);

    result.optimizedResume = optimizedText;
    result.isOptimized = true;
    await result.save();

    console.log("✅ Resume optimized successfully");

    res.json({
      success: true,
      message: "✅ Resume optimized successfully",
      optimizedResume: optimizedText,
    });
  } catch (error) {
    console.error("❌ Optimization Error:", error.message);
    res
      .status(500)
      .json({ message: "Optimization failed", error: error.message });
  }
};

// ✅ Update optimized resume (when user edits it)
exports.updateOptimizedResume = async (req, res) => {
  const { resultId, optimizedResume } = req.body;

  try {
    const result = await Result.findOne({
      _id: resultId,
      userId: req.session.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    result.optimizedResume = optimizedResume;
    await result.save();

    res.json({
      success: true,
      message: "✅ Optimized resume updated successfully",
    });
  } catch (error) {
    console.error("❌ Update Error:", error.message);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ✅ Keep the original full analysis function for backward compatibility
exports.analyzeResume = async (req, res) => {
  return exports.analyzeResumeInitial(req, res);
};

module.exports = exports;