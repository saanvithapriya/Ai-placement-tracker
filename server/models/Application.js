const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  date:   { type: Date, default: Date.now },
  note:   { type: String, default: '' },
});

// Per-student status entry for admin-created drives
const studentStatusSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:         { type: String, enum: ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'], default: 'Applied' },
  starred:        { type: Boolean, default: false },
  updatedAt:      { type: Date, default: Date.now },
  // Stage timestamps — set once by admin action, never overwritten
  applied_at:     { type: Date, default: Date.now },
  shortlisted_at: { type: Date, default: null },
  interview_at:   { type: Date, default: null },
  offer_at:       { type: Date, default: null },
  rejected_at:    { type: Date, default: null },
});

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // true = admin-created placement drive (visible to all students)
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    // Per-student status tracking (only used when createdByAdmin: true)
    studentStatuses: {
      type: [studentStatusSchema],
      default: [],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    location: { type: String, default: '' },
    package:  { type: Number, default: 0 },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
    appliedDate:   { type: Date, default: Date.now },
    deadline:      { type: Date },
    jobUrl:        { type: String, default: '' },
    jobDescription:{ type: String, default: '' },
    notes:         { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    interviewDate: { type: Date },
    timeline:      { type: [timelineEventSchema], default: [] },
    aiMatchScore:  { type: Number, default: null },
    priority:      { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    starred:       { type: Boolean, default: false },
    // Eligibility criteria (admin-set)
    eligibilityCgpa:   { type: Number, default: 0 },
    eligibilityBranch: { type: [String], default: [] },
    driveDate:         { type: Date },
    // Drive archival — set isActive: false to close a drive without deleting it
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
