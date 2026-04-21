const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    packageRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    recruitmentDriveDate: {
      type: Date,
    },
    eligibilityCriteria: {
      minCgpa: { type: Number, default: 0 },
      branches: { type: [String], default: [] },
      backlogs: { type: Number, default: 0 },
    },
    jobRoles: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Closed'],
      default: 'Upcoming',
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    selectionCount: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', companySchema);
