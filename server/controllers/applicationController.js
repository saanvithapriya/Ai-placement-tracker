const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');

// @desc    Get all applications for logged-in user
// @route   GET /api/applications
const getApplications = asyncHandler(async (req, res) => {
  const { status, search, sort = '-createdAt' } = req.query;
  const filter = { user: req.user._id };

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { company: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  const applications = await Application.find(filter).sort(sort);
  const stats = {
    total: await Application.countDocuments({ user: req.user._id }),
    applied: await Application.countDocuments({ user: req.user._id, status: 'Applied' }),
    shortlisted: await Application.countDocuments({ user: req.user._id, status: 'Shortlisted' }),
    interview: await Application.countDocuments({ user: req.user._id, status: 'Interview' }),
    offer: await Application.countDocuments({ user: req.user._id, status: 'Offer' }),
    rejected: await Application.countDocuments({ user: req.user._id, status: 'Rejected' }),
  };

  res.json({ success: true, count: applications.length, stats, applications });
});

// @desc    Get single application
// @route   GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) { res.status(404); throw new Error('Application not found'); }
  res.json({ success: true, application: app });
});

// @desc    Create application
// @route   POST /api/applications
const createApplication = asyncHandler(async (req, res) => {
  const app = await Application.create({
    ...req.body,
    user: req.user._id,
    timeline: [{ status: req.body.status || 'Applied', date: new Date() }],
  });
  res.status(201).json({ success: true, application: app });
});

// @desc    Update application
// @route   PUT /api/applications/:id
const updateApplication = asyncHandler(async (req, res) => {
  let app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) { res.status(404); throw new Error('Application not found'); }

  const oldStatus = app.status;
  Object.assign(app, req.body);

  // Add timeline event if status changed
  if (req.body.status && req.body.status !== oldStatus) {
    app.timeline.push({ status: req.body.status, date: new Date(), note: req.body.statusNote || '' });
  }

  await app.save();
  res.json({ success: true, application: app });
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
const deleteApplication = asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) { res.status(404); throw new Error('Application not found'); }
  await app.deleteOne();
  res.json({ success: true, message: 'Application deleted' });
});

// @desc    Toggle starred
// @route   PUT /api/applications/:id/star
const toggleStar = asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) { res.status(404); throw new Error('Application not found'); }
  app.starred = !app.starred;
  await app.save();
  res.json({ success: true, starred: app.starred });
});

module.exports = { getApplications, getApplication, createApplication, updateApplication, deleteApplication, toggleStar };
