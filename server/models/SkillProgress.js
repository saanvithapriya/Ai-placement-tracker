const mongoose = require('mongoose');

const skillProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Language', 'Framework', 'Tool', 'Concept', 'Soft Skill', 'Other'],
      default: 'Other',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    target: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one entry per skill per user
skillProgressSchema.index({ user: 1, name: 1 }, { unique: true });

// Auto-set status based on progress
skillProgressSchema.pre('save', function () {
  if (this.progress >= this.target) {
    this.status = 'Completed';
  } else if (this.progress > 0) {
    this.status = 'In Progress';
  } else {
    this.status = 'Not Started';
  }
});

module.exports = mongoose.model('SkillProgress', skillProgressSchema);
