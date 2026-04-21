const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Application = require('../models/Application');
const Company = require('../models/Company');

// @desc    Get platform-wide stats
// @route   GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalApplications, totalOffers, totalCompanies] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Application.countDocuments(),
    Application.countDocuments({ status: 'Offer' }),
    Company.countDocuments(),
  ]);

  const statusBreakdown = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const branchStats = await User.aggregate([
    { $match: { role: 'student', branch: { $ne: '' } } },
    { $group: { _id: '$branch', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const topCompanies = await Application.aggregate([
    { $match: { status: 'Offer' } },
    { $group: { _id: '$company', offers: { $sum: 1 } } },
    { $sort: { offers: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    stats: {
      totalStudents,
      totalApplications,
      totalOffers,
      totalCompanies,
      placementRate: totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0,
      statusBreakdown,
      branchStats,
      topCompanies,
    },
  });
});

// @desc    Get all students
// @route   GET /api/admin/students
const getStudents = asyncHandler(async (req, res) => {
  const { search, branch, year } = req.query;
  const filter = { role: 'student' };
  if (branch) filter.branch = branch;
  if (year) filter.year = year;
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const students = await User.find(filter).select('-password').sort('-createdAt');
  res.json({ success: true, count: students.length, students });
});

// ── Company Routes ──────────────────────────────────────────────────────────

// @route   GET /api/admin/companies
const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find().sort('-createdAt');
  res.json({ success: true, companies });
});

// @route   POST /api/admin/companies
const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({ ...req.body, addedBy: req.user._id });
  res.status(201).json({ success: true, company });
});

// @route   PUT /api/admin/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) { res.status(404); throw new Error('Company not found'); }
  res.json({ success: true, company });
});

// @route   DELETE /api/admin/companies/:id
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) { res.status(404); throw new Error('Company not found'); }
  res.json({ success: true, message: 'Company deleted' });
});

module.exports = { getStats, getStudents, getCompanies, createCompany, updateCompany, deleteCompany };
