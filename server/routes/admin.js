const express = require('express');
const router = express.Router();
const {
  getStats, getStudents, getCompanies, createCompany, updateCompany, deleteCompany,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/students', getStudents);
router.route('/companies').get(getCompanies).post(createCompany);
router.route('/companies/:id').put(updateCompany).delete(deleteCompany);

module.exports = router;
