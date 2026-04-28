const Application        = require('../models/Application');
const StudentApplication = require('../models/StudentApplication');

// ── State machine ─────────────────────────────────────────────────────────────
// Single source of truth — also exported for adminController.
const ALLOWED_TRANSITIONS = {
  Applied:     ['Shortlisted'],
  Shortlisted: ['Interview'],
  Interview:   ['Offer', 'Rejected'],
  Offer:       [],
  Rejected:    [],
};

const STAGE_TIMESTAMP = {
  Shortlisted: 'shortlisted_at',
  Interview:   'interview_at',
  Offer:       'offer_at',
  Rejected:    'rejected_at',
};

// @desc    Get all drives visible to the current user.
//          Admin → all admin-created drives (with drive-level status).
//          Student → all admin-created drives, enriched with their own StudentApplication status.
// @route   GET /api/applications
const getApplications = async (req, res) => {
  const { search, sort = '-createdAt' } = req.query;
  const isAdmin = req.user.role === 'admin';

  const filter = { createdByAdmin: true };
  if (search) {
    filter.$or = [
      { company: { $regex: search, $options: 'i' } },
      { role:    { $regex: search, $options: 'i' } },
    ];
  }

  const drives = await Application.find(filter).sort(sort);

  let enriched;
  if (isAdmin) {
    // Admin sees the drive-level fields; per-student detail is in the Drives tab
    enriched = drives.map((d) => d.toObject());
  } else {
    // Fetch all of this student's applications in one query
    const myApps = await StudentApplication.find({
      student: req.user._id,
      drive:   { $in: drives.map((d) => d._id) },
    }).lean();

    const myAppMap = {};
    myApps.forEach((a) => { myAppMap[a.drive.toString()] = a; });

    enriched = drives.map((d) => {
      const obj   = d.toObject();
      const myApp = myAppMap[d._id.toString()];
      if (myApp) {
        obj._studentAppId   = myApp._id;
        obj.status          = myApp.status;
        obj.starred         = myApp.starred;
        obj.applied         = true;             // student HAS applied
        obj.applied_at      = myApp.applied_at;
        obj.shortlisted_at  = myApp.shortlisted_at;
        obj.interview_at    = myApp.interview_at;
        obj.offer_at        = myApp.offer_at;
        obj.rejected_at     = myApp.rejected_at;
      } else {
        obj.status  = null;   // null = "not yet applied"
        obj.applied = false;
        obj.starred = false;
      }
      return obj;
    });
  }

  // Stats (student-centric)
  const stats = {
    total:       enriched.length,
    applied:     enriched.filter((a) => a.status === 'Applied').length,
    shortlisted: enriched.filter((a) => a.status === 'Shortlisted').length,
    interview:   enriched.filter((a) => a.status === 'Interview').length,
    offer:       enriched.filter((a) => a.status === 'Offer').length,
    rejected:    enriched.filter((a) => a.status === 'Rejected').length,
  };

  res.json({ success: true, count: enriched.length, stats, applications: enriched });
};

// @desc    Get a single drive (with this student's application status if applicable)
// @route   GET /api/applications/:id
const getApplication = async (req, res) => {
  const drive = await Application.findById(req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  const obj = drive.toObject();
  if (req.user.role !== 'admin') {
    const myApp = await StudentApplication.findOne({
      drive: drive._id, student: req.user._id,
    }).lean();
    if (myApp) {
      obj._studentAppId = myApp._id;
      obj.status        = myApp.status;
      obj.applied       = true;
    } else {
      obj.status  = null;
      obj.applied = false;
    }
  }
  res.json({ success: true, application: obj });
};

// @desc    Student clicks "Apply" — creates a StudentApplication (status: Applied).
//          Admin creates a Drive (plain Application doc).
// @route   POST /api/applications
const createApplication = async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  if (isAdmin) {
    // Admin creates a placement drive
    const drive = await Application.create({
      ...req.body,
      user:            req.user._id,
      createdByAdmin:  true,
      status:          'Applied',   // drive-level placeholder
      timeline:        [{ status: 'Applied', date: new Date() }],
      studentStatuses: [],          // legacy field — kept for model compat, not used
    });
    return res.status(201).json({ success: true, application: drive });
  }

  // Student applies to an existing drive
  const { driveId } = req.body;
  if (!driveId) {
    return res.status(400).json({ success: false, message: 'driveId is required to apply' });
  }

  const drive = await Application.findOne({ _id: driveId, createdByAdmin: true });
  if (!drive) {
    return res.status(404).json({ success: false, message: 'Drive not found' });
  }

  // Block apply on inactive (archived) drives
  if (drive.isActive === false) {
    return res.status(403).json({ success: false, message: 'This drive is no longer accepting applications' });
  }

  try {
    const app = await StudentApplication.create({
      drive:    driveId,
      student:  req.user._id,
      status:   'Applied',
      applied_at: new Date(),
    });
    return res.status(201).json({ success: true, application: app });
  } catch (err) {
    if (err.code === 11000) {
      // Unique index violation — already applied
      return res.status(409).json({ success: false, message: 'You have already applied to this drive' });
    }
    throw err;
  }
};

// @desc    Update drive metadata (admin only). Status changes go through admin route.
// @route   PUT /api/applications/:id
const updateApplication = async (req, res) => {
  const drive = await Application.findById(req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  const isAdmin = req.user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Students cannot edit drives. Status changes are controlled by the placement officer.',
    });
  }

  // Strip status / studentStatuses from admin drive-metadata edits
  const { status, studentStatuses, ...safeBody } = req.body;
  Object.assign(drive, safeBody);
  await drive.save();
  return res.json({ success: true, application: drive });
};

// @desc    Delete drive (admin only)
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can delete drives' });
  }
  const drive = await Application.findById(req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  // Also remove all student applications for this drive
  await StudentApplication.deleteMany({ drive: drive._id });
  await drive.deleteOne();
  res.json({ success: true, message: 'Drive and all related applications deleted' });
};

// @desc    Toggle starred on a student's application
// @route   PUT /api/applications/:id/star
const toggleStar = async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  if (isAdmin) {
    const drive = await Application.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    drive.starred = !drive.starred;
    await drive.save();
    return res.json({ success: true, starred: drive.starred });
  }

  const myApp = await StudentApplication.findOne({
    drive: req.params.id, student: req.user._id,
  });
  if (!myApp) {
    return res.status(404).json({ success: false, message: 'You have not applied to this drive yet' });
  }
  myApp.starred = !myApp.starred;
  await myApp.save();
  return res.json({ success: true, starred: myApp.starred });
};

module.exports = {
  getApplications, getApplication, createApplication,
  updateApplication, deleteApplication, toggleStar,
  ALLOWED_TRANSITIONS, STAGE_TIMESTAMP,
};
