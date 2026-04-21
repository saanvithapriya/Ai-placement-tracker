import api from './axios';

export const analyzeResume = (resumeText) => api.post('/ai/analyze-resume', { resumeText });
export const matchJD = (resumeText, jobDescription) => api.post('/ai/match-jd', { resumeText, jobDescription });
export const getInterviewPrep = (role, question) => api.post('/ai/interview-prep', { role, question });
export const getCareerInsights = (skills, targetRole) => api.post('/ai/career-insights', { skills, targetRole });
