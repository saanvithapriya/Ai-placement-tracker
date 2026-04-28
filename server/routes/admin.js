const express = require('express');
const router = express.Router();
const {
  getStats, getStudents,
  getCompanies, createCompany, updateCompany, deleteCompany,
  getDrives, getDriveApplicants, shortlistStudent,
  getNotifications, markNotificationRead, markAllNotificationsRead,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/students', getStudents);
router.route('/companies').get(getCompanies).post(createCompany);
router.route('/companies/:id').put(updateCompany).delete(deleteCompany);
router.get('/drives', getDrives);
router.get('/drives/:id/applicants', getDriveApplicants);
router.put('/drives/:id/applicants/:userId/status', shortlistStudent);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
