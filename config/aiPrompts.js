// ========================================
// AI Configuration and Prompts
// ========================================

const AI_CONFIG = {
  model: "claude-sonnet-4-5-20250929",
  initialAnalysis: {
    maxTokens: 5000,
    temperature: 0.7,
  },
};

/**
 * This is the ONLY prompt used in the system
 * It analyzes the resume and creates an optimized version
 * ✅ BOTH resumeText and jobDescription are REQUIRED
 */
const RESUME_OPTIMIZATION_PROMPT = (resumeText, jobDescription) => `
<RESUME_TEXT_VERSION>
${resumeText}
</RESUME_TEXT_VERSION>

<JOB_DESCRIPTION>
${jobDescription}
</JOB_DESCRIPTION>

You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to analyze the provided resume text and create an enhanced, ATS-optimized version using ONLY the information explicitly present in the original text.

INPUT HANDLING:
- ✅ A job description is ALWAYS provided
- Align the resume content to match the job requirements by emphasizing relevant skills, experiences, and keywords from the job posting

🚨 CRITICAL RULES - NEVER VIOLATE:
- Work ONLY with the text that has been scanned/extracted from the resume
- DO NOT add any skills, experiences, certifications, or qualifications that are not already present in the original resume
- DO NOT fill gaps or infer missing information
- DO NOT suggest adding new content
- DO NOT fabricate or invent certifications, courses, or achievements
- ONLY reorganize, reformat, and optimize the existing content for ATS compatibility
- When a job description is provided, prioritize and emphasize experiences/skills that match the job requirements, but never fabricate new ones
- If information is unclear or incomplete, preserve it as-is rather than inventing details
- Focus on: improving formatting, enhancing keyword placement, optimizing section headers, ensuring ATS-friendly structure, and (if job description provided) strategic emphasis of relevant qualifications

🎯 CERTIFICATIONS RULE:
- If the original resume has NO certifications section or mentions NO certifications → Set certifications to empty string ""
- If the original resume mentions certifications → Include them in enhanced resume
- NEVER add placeholder text like "N/A", "None", "To be added", or example certifications
- When in doubt, leave certifications as empty string ""

Your optimization should make the scanned content more ATS-friendly without adding ANY new substantive information.

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
    "originalResume": {
  "education": [
    {
      "degree": "string - full degree title",
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
      "linkedin": "string - ONLY if exists in original, otherwise empty string"
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
        "period": "string"
      }
    ],
    "skills": {
      "technical": ["string - specific technical skills"],
      "soft": ["string - specific soft skills"]
    },
    "languages": ["string - language with proficiency level"],
    "certifications": "string - MUST BE EMPTY STRING if none in original resume, otherwise list existing certifications separated by bullet points"
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

🚨 RETURN ONLY VALID JSON - NO MARKDOWN, NO EXPLANATIONS, NO PREAMBLE
`;

module.exports = {
  AI_CONFIG,
  RESUME_OPTIMIZATION_PROMPT,
};