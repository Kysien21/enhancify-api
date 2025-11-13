// ========================================
// AI Configuration and Prompts
// ========================================
// This file contains all AI prompts, model configurations, and mock data
// for the resume optimization system.

/**
 * AI Model Configuration
 */
const AI_CONFIG = {
    model: 'claude-3-7-sonnet-20250219',
    initialAnalysis: {
        maxTokens: 2000,
        temperature: 0.7
    },
    optimization: {
        maxTokens: 3000,
        temperature: 0.7
    }
};

/**
 * Initial Analysis Prompt
 * Used for scoring the resume without optimization
 */
const INITIAL_ANALYSIS_PROMPT = (resumeText, jobDescription) => `
You are a resume analysis assistant.

Analyze the user's resume based on the job description and provide ONLY scoring and feedback.

📌 DO NOT optimize or rewrite the resume yet.

🧾 RESPONSE FORMAT — STRICTLY RETURN JSON LIKE THIS:

{
  "overallScore": <number 0-100>,
  "jobMatchScore": <number 0-100>,
  "atsCompatibilityScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "briefSummary": "A 2-3 sentence analysis of the resume's strengths and areas for improvement",
  "missingSkills": [<array of skills missing from resume>],
  "missingPhrases": [<array of important phrases from job description>]
}

SCORING GUIDELINES:
- overallScore: Overall quality and match (0-100)
- jobMatchScore: How well the resume matches the job requirements (0-100)
- atsCompatibilityScore: How well it will pass ATS systems (0-100)
- readabilityScore: How easy it is to read and understand (0-100)

Return ONLY valid JSON — no markdown, code blocks, or explanations.

Original Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`;

/**
 * Resume Optimization Prompt
 * Used for rewriting/enhancing the resume
 */
const OPTIMIZATION_PROMPT = (resumeText, jobDescription, missingSkills, missingPhrases) => `
You are a resume optimization assistant.

Your task is to REWRITE the resume to better match the job description.

⚠️ KEEP THESE FIELDS INTACT AND UNCHANGED:
- Full Name
- Email
- Contact Number
- LinkedIn (if present)
- Location / Address

✅ You are allowed to improve:
- Professional Summary or Profile
- Skills or Core Competencies
- Work Experience (if present)
- Education
- Grammar, consistency, layout, formatting
- Add missing keywords and skills based on the job description

🧾 RETURN ONLY THE OPTIMIZED RESUME TEXT:
Do not add any JSON wrapper, markdown, or explanations.
Return ONLY the optimized resume content as plain text.

Original Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""

Missing Skills to incorporate: ${missingSkills.join(', ')}
Missing Phrases to incorporate: ${missingPhrases.join(', ')}
`;

/**
 * Mock Data for Initial Analysis
 * Used when USE_MOCK=true or mock=true query parameter
 */
const MOCK_INITIAL_ANALYSIS = {
    overallScore: 85,
    jobMatchScore: 78,
    atsCompatibilityScore: 82,
    readabilityScore: 92,
    briefSummary: "Strong technical background with relevant experience. Resume could benefit from more specific metrics and inclusion of Docker and PostgreSQL skills to better match the job requirements.",
    missingSkills: ["Docker", "PostgreSQL", "CI/CD"],
    missingPhrases: ["agile methodology", "cross-functional teams"]
};

/**
 * Mock Data for Optimized Resume
 * Used when USE_MOCK=true or mock=true query parameter
 */
const MOCK_OPTIMIZED_RESUME = `JOHN DOE
Email: john.doe@email.com | Phone: +1234567890
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions using agile methodology while working with cross-functional teams. Expertise in CI/CD pipelines, Docker, and PostgreSQL.

TECHNICAL SKILLS
• Languages: JavaScript, Python, Java
• Frameworks: React, Node.js, Express
• DevOps: Docker, CI/CD, PostgreSQL
• Cloud: AWS, Azure
• Methodologies: Agile, Scrum

PROFESSIONAL EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
• Led cross-functional teams in developing microservices architecture
• Implemented CI/CD pipelines reducing deployment time by 40%
• Managed PostgreSQL databases and Docker containerization
• Collaborated using agile methodology

Software Developer | StartUp Inc | 2018 - 2020
• Developed full-stack applications using React and Node.js
• Optimized database queries improving performance by 30%

EDUCATION
Bachelor of Science in Computer Science
State University | 2018`;

/**
 * Helper function to get mock or real prompt
 */
const getPrompt = {
    initialAnalysis: (resumeText, jobDescription) => {
        return INITIAL_ANALYSIS_PROMPT(resumeText, jobDescription);
    },
    
    optimization: (resumeText, jobDescription, missingSkills, missingPhrases) => {
        return OPTIMIZATION_PROMPT(resumeText, jobDescription, missingSkills, missingPhrases);
    }
};

/**
 * Helper function to get mock data
 */
const getMockData = {
    initialAnalysis: () => {
        return JSON.stringify(MOCK_INITIAL_ANALYSIS);
    },
    
    optimization: () => {
        return MOCK_OPTIMIZED_RESUME;
    }
};

/**
 * Check if mock mode should be enabled
 */
const shouldUseMock = (req) => {
    const isDev = process.env.NODE_ENV === 'development';
    const queryMock = req.query.mock === 'true';
    const envMock = process.env.USE_MOCK === 'true';
    
    return queryMock || envMock;
};

/**
 * Check if AI calls are allowed (prevent token usage in dev)
 */
const isAICallAllowed = (useMock) => {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!useMock && isDev) {
        return {
            allowed: false,
            message: "⚠️ Token usage disabled in dev mode."
        };
    }
    
    return { allowed: true };
};

module.exports = {
    AI_CONFIG,
    getPrompt,
    getMockData,
    shouldUseMock,
    isAICallAllowed,
    
    // Export raw prompts for reference/documentation
    INITIAL_ANALYSIS_PROMPT,
    OPTIMIZATION_PROMPT,
    MOCK_INITIAL_ANALYSIS,
    MOCK_OPTIMIZED_RESUME
};