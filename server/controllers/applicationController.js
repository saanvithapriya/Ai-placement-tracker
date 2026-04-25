const Application = require('../models/Application');

// @desc    Get applications
//          Admin: all applications they created (drives)
//          Student: all admin-created drives + their own status
// @route   GET /api/applications
const getApplications = async (req, res) => {
  const { status, search, sort = '-createdAt' } = req.query;
  const isAdmin = req.user.role === 'admin';

  // Build filter
  const filter = isAdmin
    ? { createdByAdmin: true }  // admin sees all drives they created
    : { createdByAdmin: true };  // students see all drives too

  // Students also see their own personal applications
  if (!isAdmin) {
    filter.$or = [
      { createdByAdmin: true },
      { user: req.user._id, createdByAdmin: { $ne: true } },
    ];
    delete filter.createdByAdmin;
  }

  if (status) filter.status = status;
  if (search) {
    const searchFilter = {
      $or: [
        { company: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ],
    };
    filter.$and = filter.$and ? [...filter.$and, searchFilter] : [searchFilter];
  }

  const applications = await Application.find(filter).sort(sort);

  // For students, merge their personal status from studentStatuses map
  const enriched = applications.map((app) => {
    const obj = app.toObject();
    if (!isAdmin && app.studentStatuses) {
      const myEntry = app.studentStatuses.find(
        (s) => s.user.toString() === req.user._id.toString()
      );
      if (myEntry) {
        obj.status = myEntry.status;
        obj.starred = myEntry.starred;
      } else {
        obj.status = 'Applied';
        obj.starred = false;
      }
    }
    return obj;
  });

  // Count stats
  const allDrives = await Application.countDocuments(
    isAdmin ? { createdByAdmin: true } : { $or: [{ createdByAdmin: true }, { user: req.user._id }] }
  );

  const stats = {
    total: allDrives,
    applied: enriched.filter((a) => a.status === 'Applied').length,
    shortlisted: enriched.filter((a) => a.status === 'Shortlisted').length,
    interview: enriched.filter((a) => a.status === 'Interview').length,
    offer: enriched.filter((a) => a.status === 'Offer').length,
    rejected: enriched.filter((a) => a.status === 'Rejected').length,
  };

  res.json({ success: true, count: enriched.length, stats, applications: enriched });
};

// @desc    Get single application
// @route   GET /api/applications/:id
const getApplication = async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id };
  const app = await Application.findOne(filter);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, application: app });
};

// @desc    Create application (admin only for drives; students can also add personal ones)
// @route   POST /api/applications
const createApplication = async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  const app = await Application.create({
    ...req.body,
    user: req.user._id,
    createdByAdmin: isAdmin,
    timeline: [{ status: req.body.status || 'Applied', date: new Date() }],
    studentStatuses: [],
  });
  res.status(201).json({ success: true, application: app });
};

// @desc    Update application
//          Admin: can update all fields
//          Student: can only update their own status (stored in studentStatuses)
// @route   PUT /api/applications/:id
const updateApplication = async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  const isAdmin = req.user.role === 'admin';

  if (isAdmin) {
    // Admin can change everything
    const oldStatus = app.status;
    Object.assign(app, req.body);
    if (req.body.status && req.body.status !== oldStatus) {
      app.timeline.push({ status: req.body.status, date: new Date() });
    }
    await app.save();
    return res.json({ success: true, application: app });
  }

  // Student: only update their status entry in studentStatuses
  if (req.body.status) {
    const existingIdx = app.studentStatuses.findIndex(
      (s) => s.user.toString() === req.user._id.toString()
    );
    if (existingIdx >= 0) {
      app.studentStatuses[existingIdx].status = req.body.status;
      app.studentStatuses[existingIdx].updatedAt = new Date();
    } else {
      app.studentStatuses.push({ user: req.user._id, status: req.body.status, updatedAt: new Date() });
    }
    app.markModified('studentStatuses');
    await app.save();
    return res.json({ success: true, application: { ...app.toObject(), status: req.body.status } });
  }

  return res.status(403).json({ success: false, message: 'Students can only update their application status' });
};

// @desc    Delete application (admin only)
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can delete applications' });
  }
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  await app.deleteOne();
  res.json({ success: true, message: 'Application deleted' });
};

// @desc    Toggle starred (per-student)
// @route   PUT /api/applications/:id/star
const toggleStar = async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  const isAdmin = req.user.role === 'admin';
  if (isAdmin) {
    app.starred = !app.starred;
    await app.save();
    return res.json({ success: true, starred: app.starred });
  }

  // For students, toggle in their studentStatuses entry
  const existingIdx = app.studentStatuses.findIndex(
    (s) => s.user.toString() === req.user._id.toString()
  );
  if (existingIdx >= 0) {
    app.studentStatuses[existingIdx].starred = !app.studentStatuses[existingIdx].starred;
    app.markModified('studentStatuses');
    await app.save();
    return res.json({ success: true, starred: app.studentStatuses[existingIdx].starred });
  } else {
    app.studentStatuses.push({ user: req.user._id, status: 'Applied', starred: true });
    app.markModified('studentStatuses');
    await app.save();
    return res.json({ success: true, starred: true });
  }
};

module.exports = { getApplications, getApplication, createApplication, updateApplication, deleteApplication, toggleStar };
