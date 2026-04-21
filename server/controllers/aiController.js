const asyncHandler = require('express-async-handler');
const { analyzeResume, matchJD, getInterviewAnswer, getCareerInsights } = require('../services/aiService');

// @desc    Analyze resume text
// @route   POST /api/ai/analyze-resume
const analyzeResumeController = asyncHandler(async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText || resumeText.trim().length < 50) {
    res.status(400); throw new Error('Please provide resume text (at least 50 characters)');
  }
  const analysis = await analyzeResume(resumeText);
  res.json({ success: true, analysis });
});

// @desc    Match resume to job description
// @route   POST /api/ai/match-jd
const matchJDController = asyncHandler(async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    res.status(400); throw new Error('Both resumeText and jobDescription are required');
  }
  const result = await matchJD(resumeText, jobDescription);
  res.json({ success: true, result });
});

// @desc    Get interview prep answer
// @route   POST /api/ai/interview-prep
const interviewPrepController = asyncHandler(async (req, res) => {
  const { role, question } = req.body;
  if (!role || !question) {
    res.status(400); throw new Error('Both role and question are required');
  }
  const result = await getInterviewAnswer(role, question);
  res.json({ success: true, result });
});

// @desc    Get career insights
// @route   POST /api/ai/career-insights
const careerInsightsController = asyncHandler(async (req, res) => {
  const { skills, targetRole } = req.body;
  const result = await getCareerInsights(skills || [], targetRole || '');
  res.json({ success: true, result });
});

module.exports = { analyzeResumeController, matchJDController, interviewPrepController, careerInsightsController };
