const express = require('express');
const router = express.Router();
const {
  analyzeResumeController, matchJDController,
  interviewPrepController, careerInsightsController,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/analyze-resume', analyzeResumeController);
router.post('/match-jd', matchJDController);
router.post('/interview-prep', interviewPrepController);
router.post('/career-insights', careerInsightsController);

module.exports = router;
