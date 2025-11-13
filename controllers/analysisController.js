// controllers/analysisController.js
require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');

const Result = require('../models/Result');
const Feedback = require('../models/Feedback');
const History = require('../models/History');

// ✅ Import AI configuration and prompts
const {
    AI_CONFIG,
    getPrompt,
    getMockData,
    shouldUseMock,
    isAICallAllowed
} = require('../config/aiPrompts');

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

// ✅ NEW: Initial analysis after upload (scores only, no optimization yet)
exports.analyzeResumeInitial = async(req, res) => {
    const { resumeText, jobDescription, category } = req.body;
    
    // ✅ Check if mock mode is enabled
    const USE_MOCK = shouldUseMock(req);
    
    console.log("🔁 Mock Mode:", USE_MOCK ? "ON" : "OFF");
    console.log("🏷️ Job Category:", category);

    // ✅ Check if AI call is allowed
    const aiCheck = isAICallAllowed(USE_MOCK);
    if (!aiCheck.allowed) {
        return res.status(403).json({ message: aiCheck.message });
    }

    if (!resumeText || !jobDescription) {   
        return res.status(400).json({ message: "Resume and job description required." });
    }

    if (!req.session.user || !resumeText || !jobDescription) {
    return res.status(400).json({ message: "Missing required data." });
    }


    try {
        // ✅ Get prompt from config file
        const prompt = getPrompt.initialAnalysis(resumeText, jobDescription);

        let resultText;

        if (USE_MOCK) {
            // ✅ Get mock data from config file
            resultText = getMockData.initialAnalysis();
        } else {
            console.log("🧠 Calling Claude API for initial analysis...");
            
            // ✅ Use AI config from config file
            const response = await anthropic.messages.create({
                model: AI_CONFIG.model,
                max_tokens: AI_CONFIG.initialAnalysis.maxTokens,
                temperature: AI_CONFIG.initialAnalysis.temperature,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: prompt,
                    }]
                }]
            });
            resultText = response.content[0].text;

            if (response.usage) {
                console.log("📊 Claude Token Usage:");
                console.log(" - Input Tokens:", response.usage.input_tokens);
                console.log(" - Output Tokens:", response.usage.output_tokens);
            }
        }

        console.log("AI Response:", resultText);

        let analysis;
        try {
            resultText = resultText
                .trim()
                .replace(/^```json/, '')
                .replace(/^```/, '')
                .replace(/```$/, '')
                .replace(/"""/g, '"')
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']');

            analysis = JSON.parse(resultText);

            if (typeof analysis !== 'object' || !analysis.overallScore) {
                return res.status(500).json({ message: "Invalid AI response structure", raw: resultText });
            }

        } catch (parseErr) {
            return res.status(500).json({
                message: "Failed to parse AI response",
                raw: resultText,
            });
        }

        // Save initial result (without optimization)
        const result = await Result.create({
            userId: req.session.user._id,
            resumeText,
            optimizedResume: null, // ✅ Not optimized yet
            jobDescription,
            category,
            overallScore: analysis.overallScore,
            jobMatchScore: analysis.jobMatchScore || analysis.overallScore,
            missingSkills: analysis.missingSkills,
            missingPhrases: analysis.missingPhrases,
            isOptimized: false, // ✅ Track optimization status
            createdAt: new Date()
        });

        console.log("✅ Initial analysis saved. Result ID:", result._id);

        // Save feedback
        await Feedback.create({
            userId: req.session.user._id,
            resultId: result._id,
            atsCompatibilityScore: analysis.atsCompatibilityScore,
            readabilityScore: analysis.readabilityScore,
            briefSummary: analysis.briefSummary,
            createdAt: new Date()
        });

        console.log("✅ Feedback saved successfully.");

        res.json({
            success: true,
            message: "✅ Resume analyzed successfully",
            resultId: result._id,
            overallScore: analysis.overallScore,
            jobMatchScore: analysis.jobMatchScore || analysis.overallScore,
            atsCompatibilityScore: analysis.atsCompatibilityScore,
            readabilityScore: analysis.readabilityScore,
            briefSummary: analysis.briefSummary,
            missingSkills: analysis.missingSkills,
            missingPhrases: analysis.missingPhrases
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ message: "Analysis failed", error: error.message });
    }
};

// ✅ NEW: Optimize/Enhancify the resume (called when user clicks "Enhancify")
exports.optimizeResume = async(req, res) => {
    const { resultId } = req.body;
    
    // ✅ Check if mock mode is enabled
    const USE_MOCK = shouldUseMock(req);

    try {
        // Get the existing result
        const result = await Result.findOne({ 
            _id: resultId, 
            userId: req.session.user._id 
        });

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        if (result.isOptimized && result.optimizedResume) {
            // Already optimized, return existing
            return res.json({
                success: true,
                message: "Resume already optimized",
                optimizedResume: result.optimizedResume
            });
        }

        // ✅ Get prompt from config file
        const prompt = getPrompt.optimization(
            result.resumeText,
            result.jobDescription,
            result.missingSkills,
            result.missingPhrases
        );

        let optimizedText;

        if (USE_MOCK) {
            // ✅ Get mock data from config file
            optimizedText = getMockData.optimization();
        } else {
            console.log("🧠 Calling Claude API for optimization...");
            
            // ✅ Use AI config from config file
            const response = await anthropic.messages.create({
                model: AI_CONFIG.model,
                max_tokens: AI_CONFIG.optimization.maxTokens,
                temperature: AI_CONFIG.optimization.temperature,
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: prompt,
                    }]
                }]
            });
            optimizedText = response.content[0].text;

            if (response.usage) {
                console.log("📊 Claude Token Usage:");
                console.log(" - Input Tokens:", response.usage.input_tokens);
                console.log(" - Output Tokens:", response.usage.output_tokens);
            }
        }

        // Clean and save optimized resume
        optimizedText = removeDuplicateLines(optimizedText);

        result.optimizedResume = optimizedText;
        result.isOptimized = true;
        await result.save();

        console.log("✅ Resume optimized successfully");

        res.json({
            success: true,
            message: "✅ Resume optimized successfully",
            optimizedResume: optimizedText
        });

    } catch (error) {
        console.error("❌ Optimization Error:", error.message);
        res.status(500).json({ message: "Optimization failed", error: error.message });
    }
};

// ✅ NEW: Update optimized resume (when user edits it)
exports.updateOptimizedResume = async(req, res) => {
    const { resultId, optimizedResume } = req.body;

    try {
        const result = await Result.findOne({ 
            _id: resultId, 
            userId: req.session.user._id 
        });

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        result.optimizedResume = optimizedResume;
        await result.save();

        res.json({
            success: true,
            message: "✅ Optimized resume updated successfully"
        });

    } catch (error) {
        console.error("❌ Update Error:", error.message);
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

// ✅ Keep the original full analysis function for backward compatibility
exports.analyzeResume = async(req, res) => {
    // This is the old combined function - redirect to the new flow
    return exports.analyzeResumeInitial(req, res);
};

module.exports = exports;