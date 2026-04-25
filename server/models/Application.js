const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
});

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    location: {
      type: String,
      default: '',
    },
    package: {
      type: Number, // in LPA
      default: 0,
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    jobUrl: {
      type: String,
      default: '',
    },
    jobDescription: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    contactPerson: {
      type: String,
      default: '',
    },
    interviewDate: {
      type: Date,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    aiMatchScore: {
      type: Number,
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    starred: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add timeline event when status changes
applicationSchema.pre('save', function () {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({ status: this.status, date: new Date() });
  }
});

module.exports = mongoose.model('Application', applicationSchema);
