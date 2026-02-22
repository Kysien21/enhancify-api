const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resumeOptimizeResultSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
     originalResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExtractedResume"
    },
    originalResume: {
      contact: {
        name: String,
        phone: String,
        email: String,
        address: String,
      },
      summary: String,
      experience: [
        {
          position: String,
          company: String,
          period: String,
          responsibilities: [String],
        },
      ],
      education: [
        {
          institution: String,
          period: String,
        },
      ],
      skills: [String],
      languages: [String],
    },
    enhancedResume: {
      contact: {
        name: String,
        phone: String,
        email: String,
        location: String,
        linkedin: String,
      },
      summary: String,
      experience: [
        {
          position: String,
          company: String,
          period: String,
          responsibilities: [String],
        },
      ],
      education: [
        {
          degree: String,
          institution: String,
          period: String,
          relevant: String,
        },
      ],
      skills: {
        technical: [String],
        soft: [String],
      },
      languages: [String],
      certifications: String,
    },
    improvements: [
      {
        category: String,
        changes: [String],
        impact: {
          type: String,
          enum: ["high", "critical"],
        },
      },
    ],
    atsScore: {
      original: Number,
      enhanced: Number,
      categories: [
        {
          name: String,
          original: Number,
          enhanced: Number,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ResumeOptimizeResult",
  resumeOptimizeResultSchema
);
