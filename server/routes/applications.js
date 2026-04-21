const express = require('express');
const router = express.Router();
const {
  getApplications, getApplication, createApplication,
  updateApplication, deleteApplication, toggleStar,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getApplications).post(createApplication);
router.route('/:id').get(getApplication).put(updateApplication).delete(deleteApplication);
router.put('/:id/star', toggleStar);

module.exports = router;
