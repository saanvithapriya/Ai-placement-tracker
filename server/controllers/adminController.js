const User               = require('../models/User');
const Application        = require('../models/Application');
const Company            = require('../models/Company');
const StudentApplication = require('../models/StudentApplication');
const Notification       = require('../models/Notification');
const { ALLOWED_TRANSITIONS, STAGE_TIMESTAMP } = require('./applicationController');
const { getIO }          = require('../socket');

// ── Stats ────────────────────────────────────────────────────────────────────
// @route GET /api/admin/stats
const getStats = async (req, res) => {
  const totalDrives = await Application.countDocuments({ createdByAdmin: true });
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalCompanies = await Company.countDocuments();

  const [totalOffers, statusBreakdown] = await Promise.all([
    StudentApplication.countDocuments({ status: 'Offer' }),
    StudentApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const branchStats = await User.aggregate([
    { $match: { role: 'student', branch: { $ne: '' } } },
    { $group: { _id: '$branch', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const topCompanies = await StudentApplication.aggregate([
    { $match: { status: 'Offer' } },
    { $lookup: { from: 'applications', localField: 'drive', foreignField: '_id', as: 'drive' } },
    { $unwind: '$drive' },
    { $group: { _id: '$drive.company', offers: { $sum: 1 } } },
    { $sort: { offers: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    stats: {
      totalStudents, totalApplications: await StudentApplication.countDocuments(),
      totalOffers, totalCompanies, totalDrives,
      placementRate: totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0,
      statusBreakdown, branchStats, topCompanies,
    },
  });
};

// ── Students ─────────────────────────────────────────────────────────────────
// @route GET /api/admin/students
const getStudents = async (req, res) => {
  const { search, branch, year } = req.query;
  const filter = { role: 'student' };
  if (branch) filter.branch = branch;
  if (year)   filter.year   = year;
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const students = await User.find(filter).select('-password').sort('-createdAt');
  res.json({ success: true, count: students.length, students });
};

// ── Companies ────────────────────────────────────────────────────────────────
const getCompanies   = async (req, res) => {
  const companies = await Company.find().sort('-createdAt');
  res.json({ success: true, companies });
};
const createCompany  = async (req, res) => {
  const company = await Company.create({ ...req.body, addedBy: req.user._id });
  res.status(201).json({ success: true, company });
};
const updateCompany  = async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  res.json({ success: true, company });
};
const deleteCompany  = async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  res.json({ success: true, message: 'Company deleted' });
};

// ── Drives ───────────────────────────────────────────────────────────────────
// @route GET /api/admin/drives
const getDrives = async (req, res) => {
  const drives = await Application.find({ createdByAdmin: true }).sort('-createdAt').lean();

  // Count applicants per drive efficiently
  const counts = await StudentApplication.aggregate([
    { $match: { drive: { $in: drives.map((d) => d._id) } } },
    { $group: { _id: '$drive', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[c._id.toString()] = c.count; });

  const result = drives.map((d) => ({
    ...d,
    applicantCount: countMap[d._id.toString()] || 0,
  }));

  res.json({ success: true, count: result.length, drives: result });
};

// @route GET /api/admin/drives/:id/applicants
const getDriveApplicants = async (req, res) => {
  const drive = await Application.findOne({ _id: req.params.id, createdByAdmin: true });
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  const applications = await StudentApplication.find({ drive: req.params.id })
    .populate('student', '-password')
    .lean();

  const applicants = applications.map((app) => ({
    _appId:         app._id,
    userId:         app.student._id,
    name:           app.student.name  || 'Unknown',
    email:          app.student.email || '',
    branch:         app.student.branch     || '',
    year:           app.student.year       || '',
    rollNumber:     app.student.rollNumber || '',
    skills:         app.student.skills    || [],
    status:         app.status,
    starred:        app.starred,
    applied_at:     app.applied_at,
    shortlisted_at: app.shortlisted_at,
    interview_at:   app.interview_at,
    offer_at:       app.offer_at,
    rejected_at:    app.rejected_at,
    previous_status: app.previous_status,
    updated_by:     app.updated_by,
    updated_at:     app.updated_at,
  }));

  res.json({ success: true, drive: drive.toObject(), applicants });
};

// ── Admin Status Transition ───────────────────────────────────────────────────
// @route PUT /api/admin/drives/:id/applicants/:userId/status
const shortlistStudent = async (req, res) => {
  const { id: driveId, userId } = req.params;
  const { status: newStatus }   = req.body;

  if (!newStatus) {
    return res.status(400).json({ success: false, message: 'New status is required' });
  }

  // 1. Verify the drive exists
  const drive = await Application.findOne({ _id: driveId, createdByAdmin: true });
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  // 2. Find the student application
  const studentApp = await StudentApplication.findOne({ drive: driveId, student: userId });
  if (!studentApp) {
    return res.status(404).json({
      success: false,
      message: 'Student has not applied to this drive',
    });
  }

  const currentStatus = studentApp.status;

  // 3. ── State-machine validation ───────────────────────────────────────────
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot transition from "${currentStatus}" to "${newStatus}". ` +
               `Allowed next steps: ${allowed.length ? allowed.join(', ') : 'none (terminal stage)'}`,
    });
  }

  // 4. ── Atomic update: only apply if status still matches ─────────────────
  const now      = new Date();
  const tsField  = STAGE_TIMESTAMP[newStatus];
  const updateOp = {
    previous_status: currentStatus,
    status:          newStatus,
    updated_by:      req.user._id,
    updated_at:      now,
  };
  if (tsField) updateOp[tsField] = now;

  const updated = await StudentApplication.findOneAndUpdate(
    { _id: studentApp._id, status: currentStatus }, // atomic check
    { $set: updateOp },
    { new: true }
  );

  if (!updated) {
    return res.status(409).json({
      success: false,
      message: 'Status was changed by another request. Please refresh and try again.',
    });
  }

  // 5. ── Create notification for the student ────────────────────────────────
  const notifMessages = {
    Shortlisted: `🎉 You have been shortlisted for ${drive.company} — ${drive.role}`,
    Interview:   `📅 Your interview has been scheduled for ${drive.company} — ${drive.role}`,
    Offer:       `🏆 Congratulations! You received an offer from ${drive.company} — ${drive.role}`,
    Rejected:    `We regret to inform you that you were not selected for ${drive.company} — ${drive.role}`,
  };
  let notification = null;
  if (notifMessages[newStatus]) {
    notification = await Notification.create({
      recipient:     userId,
      driveId,
      applicationId: updated._id,
      company:       drive.company,
      role:          drive.role,
      type:          newStatus.toLowerCase(),
      message:       notifMessages[newStatus],
    });
  }

  // 6. ── Emit real-time socket events to the student ────────────────────────
  try {
    const io   = getIO();
    const room = `user:${userId}`;

    // Push the notification into the student's bell instantly
    if (notification) {
      io.to(room).emit('notification:new', notification.toObject());
    }

    // Tell the student's Applications page to update this drive's status
    io.to(room).emit('status:updated', {
      driveId,
      applicationId: updated._id,
      status:          updated.status,
      shortlisted_at:  updated.shortlisted_at,
      interview_at:    updated.interview_at,
      offer_at:        updated.offer_at,
      rejected_at:     updated.rejected_at,
    });
  } catch (socketErr) {
    // Socket failure must never break the HTTP response
    console.warn('Socket emit failed (non-fatal):', socketErr.message);
  }

  // 6. Return updated applicant object
  const student = await User.findById(userId).select('-password');
  res.json({
    success: true,
    message: `Student moved to ${newStatus}`,
    applicant: {
      _appId:          updated._id,
      userId,
      name:            student?.name  || 'Unknown',
      email:           student?.email || '',
      branch:          student?.branch     || '',
      year:            student?.year       || '',
      rollNumber:      student?.rollNumber || '',
      status:          updated.status,
      previous_status: updated.previous_status,
      updated_by:      updated.updated_by,
      updated_at:      updated.updated_at,
      applied_at:      updated.applied_at,
      shortlisted_at:  updated.shortlisted_at,
      interview_at:    updated.interview_at,
      offer_at:        updated.offer_at,
      rejected_at:     updated.rejected_at,
    },
  });
};

// ── Notifications ─────────────────────────────────────────────────────────────
// @route GET /api/admin/notifications  (admin's own notifications — if any)
// Shared logic; the student route at /api/notifications does the same for students.
const getNotifications = async (req, res) => {
  const notifs = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt')
    .limit(50)
    .lean();
  const unreadCount = notifs.filter((n) => !n.read).length;
  res.json({ success: true, notifications: notifs, unreadCount });
};

const markNotificationRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.json({ success: true });
};

const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
};

module.exports = {
  getStats, getStudents,
  getCompanies, createCompany, updateCompany, deleteCompany,
  getDrives, getDriveApplicants, shortlistStudent,
  getNotifications, markNotificationRead, markAllNotificationsRead,
};
