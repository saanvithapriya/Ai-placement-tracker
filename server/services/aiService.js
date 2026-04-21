/**
 * AI Service — Mock Implementation
 * Replace GEMINI_API_KEY in .env and uncomment the live code below
 * when you're ready to activate real AI features.
 */

// ─── MOCK RESPONSES ────────────────────────────────────────────────────────

const mockResumeAnalysis = (resumeText) => {
  const detectedSkills = [];
  const allSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'TypeScript'];
  allSkills.forEach(s => { if (resumeText.toLowerCase().includes(s.toLowerCase())) detectedSkills.push(s); });

  return {
    overallScore: Math.floor(Math.random() * 25) + 65,
    detectedSkills: detectedSkills.length > 0 ? detectedSkills : ['JavaScript', 'HTML', 'CSS'],
    strengths: [
      'Clear project descriptions with quantifiable outcomes',
      'Good technical skill representation',
      'Consistent formatting and layout',
    ],
    improvements: [
      'Add measurable impact metrics (e.g., "reduced load time by 40%")',
      'Include links to GitHub / live demo for projects',
      'Tailor skills section to the specific job description',
      'Add a concise professional summary at the top',
    ],
    missingKeywords: ['CI/CD', 'Agile', 'REST API', 'System Design'],
    atsCompatibility: Math.floor(Math.random() * 20) + 70,
    readabilityScore: Math.floor(Math.random() * 15) + 80,
  };
};

const mockJDMatcher = (resumeText, jobDescription) => {
  const jdWords = jobDescription.toLowerCase().split(/\W+/);
  const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
  let matches = 0;
  jdWords.forEach(w => { if (w.length > 3 && resumeWords.has(w)) matches++; });
  const matchScore = Math.min(95, Math.floor((matches / Math.max(jdWords.length, 1)) * 300) + 40);

  return {
    matchScore,
    matchedSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'].slice(0, Math.ceil(matchScore / 25)),
    missingSkills: ['TypeScript', 'AWS', 'GraphQL', 'Kubernetes'].slice(0, Math.floor((100 - matchScore) / 25)),
    recommendation: matchScore > 75
      ? 'Strong fit! Tailor your cover letter to highlight your matching skills.'
      : matchScore > 50
      ? 'Moderate fit. Consider upskilling in the missing areas before applying.'
      : 'Low fit. Focus on acquiring the key missing skills first.',
    coverLetterTips: [
      'Open with your most relevant achievement',
      'Mirror the job description language in your application',
      'Highlight team projects that show collaboration',
    ],
  };
};

const mockInterviewPrep = (role, question) => {
  const responses = {
    default: [
      `Great question about ${role}! Here's a structured answer:\n\n**STAR Method:**\n- **Situation**: Set the context of a relevant past experience\n- **Task**: Describe what you were responsible for\n- **Action**: Explain the specific steps you took\n- **Result**: Share the outcome with measurable data\n\n**Sample Answer**: "In my previous project, I was tasked with optimizing database queries. I analyzed slow queries using indexing strategies and reduced average response time by 60%. This improved user experience significantly."`,
      `For a **${role}** position, this is commonly asked. Key points to cover:\n\n1. **Technical depth**: Demonstrate understanding beyond surface level\n2. **Problem-solving**: Walk through your thought process\n3. **Communication**: Practice explaining complex concepts simply\n\nTip: Use concrete examples from your projects or internships.`,
    ],
  };
  const answers = responses.default;
  return {
    answer: answers[Math.floor(Math.random() * answers.length)],
    followUpQuestions: [
      `What challenges did you face with ${question.split(' ').slice(0, 3).join(' ')}?`,
      `How would you approach this differently next time?`,
      `Can you give another example from a different context?`,
    ],
    tips: [
      'Speak clearly and at a moderate pace',
      'Use the STAR method for behavioral questions',
      'It\'s okay to take 10 seconds to think before answering',
    ],
  };
};

const mockCareerInsights = (skills, targetRole) => ({
  trending: [
    { skill: 'AI/ML Integration', demand: 'High', growth: '+45%' },
    { skill: 'Cloud Architecture', demand: 'High', growth: '+38%' },
    { skill: 'TypeScript', demand: 'Medium', growth: '+28%' },
    { skill: 'System Design', demand: 'High', growth: '+35%' },
  ],
  roadmap: [
    { milestone: 'Master Data Structures & Algorithms', priority: 'Critical', timeline: '1-2 months' },
    { milestone: 'Build 2-3 full-stack projects', priority: 'High', timeline: '2-3 months' },
    { milestone: 'Contribute to open source', priority: 'Medium', timeline: 'Ongoing' },
    { milestone: 'Prepare for system design interviews', priority: 'High', timeline: '1 month' },
  ],
  salaryInsight: {
    entry: '6-12 LPA',
    mid: '12-25 LPA',
    senior: '25-60 LPA',
  },
  topCompanies: ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'Swiggy', 'CRED'],
});

// ─── SERVICE EXPORTS ────────────────────────────────────────────────────────

const analyzeResume = async (resumeText) => {
  // TODO: Replace with live Gemini call
  // const { GoogleGenerativeAI } = require('@google/generative-ai');
  // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  // const result = await model.generateContent(`Analyze this resume and return JSON: ${resumeText}`);
  // return JSON.parse(result.response.text());

  await new Promise((r) => setTimeout(r, 800)); // simulate latency
  return mockResumeAnalysis(resumeText);
};

const matchJD = async (resumeText, jobDescription) => {
  await new Promise((r) => setTimeout(r, 600));
  return mockJDMatcher(resumeText, jobDescription);
};

const getInterviewAnswer = async (role, question) => {
  await new Promise((r) => setTimeout(r, 500));
  return mockInterviewPrep(role, question);
};

const getCareerInsights = async (skills, targetRole) => {
  await new Promise((r) => setTimeout(r, 400));
  return mockCareerInsights(skills, targetRole);
};

module.exports = { analyzeResume, matchJD, getInterviewAnswer, getCareerInsights };
