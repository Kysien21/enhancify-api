require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');

const Result = require('../models/Result');
const Feedback = require('../models/Feedback');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

function removeDuplicateLines(text) {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const uniqueLines = [...new Set(lines)];
    return uniqueLines.join('\n\n');
}


exports.analyzeResume = async(req, res) => {
    const { resumeText, jobDescription } = req.body;
    const isDev = process.env.NODE_ENV === 'development';
    const USE_MOCK = req.query.mock === 'true' || process.env.USE_MOCK === 'true';
    console.log("🔁 Mock Mode:", USE_MOCK ? "ON (No token usage)" : "OFF (Claude API will be called)");

    if (!USE_MOCK && isDev) {
        return res.status(403).json({ message: "⚠️ Token usage is disabled in dev mode. Enable mock mode." });
    }


    // ✅ Check kung naa bay resume ug job description
    if (!resumeText || !jobDescription) {
        return res.status(400).json({ message: "Both resume and job description are required." });
    }

    try {
        // Prompt para sa AI nga mo-analyze sa resume base sa job description
        // Gi-ingnan ang AI nga ayaw hilabti ang personal info
        const prompt = `
You are a resume optimization assistant.

Your task is to:
- Analyze the user's entire resume based on the job description
- Score and provide section-level feedback
- REWRITE the resume to better match the job description

📌 THIS MUST WORK FOR ALL USERS:
- Students
- Fresh Graduates
- Professionals
- Career Changers
- Any background

⚠️ KEEP THESE FIELDS INTACT AND UNCHANGED:
- Full Name
- Email
- Contact Number
- LinkedIn (if present)
- Location / Address

✅ You are allowed to improve ONLY:
- Professional Summary or Profile
- Skills or Core Competencies
- Work Experience (if present)
- Education
- Grammar, consistency, layout, formatting
- Add missing keywords and skills based on the job description

🧾 RESPONSE FORMAT — STRICTLY RETURN JSON LIKE THIS:

{
  "overallScore": <number>,
  "sectionScores": {
    "RelevanceToJob": <number>,
    "Experience": <number>,
    "Education": <number>,
    "ConsistencyAccuracy": <number>
  },
  "missingSkills": [<skills>],
  "missingPhrases": [<phrases>],
  "feedback": {
    "relevanceToJob": {
      "skillMatch": { "score": <number>, "comment": "<text>" },
      "keywordMatch": { "score": <number>, "comment": "<text>" }
    },
    "experience": {
      "workHistory": { "score": <number>, "comment": "<text>" },
      "workHistorySkillMatch": { "score": <number>, "comment": "<text>" }
    },
    "education": {
      "qualification": { "score": <number>, "comment": "<text>" },
      "relevance": { "score": <number>, "comment": "<text>" }
    },
    "consistencyAccuracy": {
      "spellingGrammar": { "score": <number>, "comment": "<text>" },
      "consistency": { "score": <number>, "comment": "<text>" }
    }
  },
  "optimizedResume": "The fully rewritten version of the resume as a valid JSON string. DO NOT format using triple quotes (\"\"\") or markdown. Use \\n for newlines and escape any double quotes inside."
}

Return ONLY this valid JSON object — do not add markdown, code blocks, or explanations.

Original Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`;


        let resultText;

        if (USE_MOCK) {
            resultText = `{
  "overallScore": 92,
  "sectionScores": {
    "RelevanceToJob": 90,
    "Experience": 95,
    "Education": 85,
    "ConsistencyAccuracy": 88
  },
  "missingSkills": ["Docker", "PostgreSQL"],
  "missingPhrases": ["agile methodology"],
  "feedback": {
    "relevanceToJob": {
      "skillMatch": {
        "score": 88,
        "comment": "Resume shows many required skills, but lacks Docker and PostgreSQL."
      },
      "keywordMatch": {
        "score": 92,
        "comment": "Most keywords from job description are present."
      }
    },
    "experience": {
      "workHistory": {
        "score": 94,
        "comment": "Strong relevant experience, but add measurable impact."
      },
      "workHistorySkillMatch": {
        "score": 91,
        "comment": "Skill usage in work history is clear and consistent."
      }
    },
    "education": {
      "qualification": {
        "score": 82,
        "comment": "Has required degree, but no certifications."
      },
      "relevance": {
        "score": 86,
        "comment": "Education is somewhat aligned with job requirements."
      }
    },
    "consistencyAccuracy": {
      "spellingGrammar": {
        "score": 89,
        "comment": "Few grammar errors detected."
      },
      "consistency": {
        "score": 90,
        "comment": "Formatting is clean and uniform."
      }
    }
  },
  "optimizedResume": "Mocked optimized resume content here..."
}`;
        } else {
            console.log("🧠 Calling Claude API now... (this will use tokens)");
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 3000,
                temperature: 0.7,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: prompt,
                    }]
                }]
            });
            resultText = response.content[0].text;

            // ✅ Log token usage
            if (response.usage) {
                console.log("📊 Claude Token Usage:");
                console.log(" - Input Tokens:", response.usage.input_tokens);
                console.log(" - Output Tokens:", response.usage.output_tokens);
                console.log(" - Total Tokens:", response.usage.input_tokens + response.usage.output_tokens);
            }
        }

        console.log("AI Response:", resultText);

        let analysis;
        try {

            // 🧼 Clean up Claude's response before parsing
            resultText = resultText
                .trim()
                .replace(/^```json/, '') // removes starting ```json
                .replace(/^```/, '') // removes just ``` kung wala json
                .replace(/```$/, '') // removes ending ```
                .replace(/"""/g, '"') // convert triple quotes to single quotes
                .replace(/,\s*}/g, '}') // removes trailing commas before }
                .replace(/,\s*]/g, ']'); // removes trailing commas before ]

            // 📦 I-parse ang JSON response gikan sa AI
            analysis = JSON.parse(resultText);
            console.log("🎯 Score:", analysis.overallScore);

            if (typeof analysis !== 'object' || !analysis.overallScore) {
                return res.status(500).json({ message: "Invalid AI response structure", raw: resultText });
            }

            if (!analysis.feedback || !analysis.feedback.relevanceToJob) {
                return res.status(500).json({ message: "Invalid feedback format from AI", raw: resultText });
            }

        } catch (parseErr) {
            return res.status(500).json({
                message: "Failed to parse AI response",
                raw: resultText,
            });
        }

        // 📝 I-save ang resulta (summary) sa Result collection
        const result = await Result.create({
            userId: req.session.user._id,
            resumeText, // ✅ Original nga extracted text
            optimizedResume: removeDuplicateLines(analysis.optimizedResume || "[No optimized resume generated by Claude]"), // ✅ Gi-optimize nga resume
            jobDescription,
            overallScore: analysis.overallScore,
            sectionScores: analysis.sectionScores,
            missingSkills: analysis.missingSkills,
            missingPhrases: analysis.missingPhrases,
            createdAt: new Date()
        });

        console.log("✅ Analysis saved successfully. Result ID:", result._id);


        // 📊 I-save ang detailed feedback sa laing collection (Feedback)
        await Feedback.create({
            userId: req.session.user._id,
            resultId: result._id,
            relevanceToJob: {
                skillMatch: analysis.feedback.relevanceToJob.skillMatch,
                keywordMatch: analysis.feedback.relevanceToJob.keywordMatch
            },
            experience: {
                workHistory: analysis.feedback.experience.workHistory,
                workHistorySkillMatch: analysis.feedback.experience.workHistorySkillMatch
            },
            education: {
                qualification: analysis.feedback.education.qualification,
                relevance: analysis.feedback.education.relevance
            },
            consistencyAccuracy: {
                spellingGrammar: analysis.feedback.consistencyAccuracy.spellingGrammar,
                consistency: analysis.feedback.consistencyAccuracy.consistency
            },
            createdAt: new Date()
        });

        // ✅ Ibalik sa frontend ang tanang result
        res.json({
            message: "✅ Resume analyzed successfully",
            overallScore: analysis.overallScore,
            resumeText // Para makita sa frontend ang original text
        });

    } catch (error) {
        console.error("❌ Error from Claude:", error.message || error);
        console.log("dili mo gana imo api waa ka")
        res.status(500).json({ message: "failed, Try Again Later", error });
    }
};