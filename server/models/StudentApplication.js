const mongoose = require('mongoose');

/**
 * StudentApplication — one document per (student × drive) pair.
 * This is the single source of truth for a student's journey through a placement drive.
 * Status can ONLY be changed by the admin via the dedicated shortlistStudent endpoint.
 */
const studentApplicationSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',   // the Drive document
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Status (controlled exclusively by admin) ───────────────────────────
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },

    // ── Stage timestamps (set once, never overwritten) ─────────────────────
    applied_at:     { type: Date, default: Date.now },
    shortlisted_at: { type: Date, default: null },
    interview_at:   { type: Date, default: null },
    offer_at:       { type: Date, default: null },
    rejected_at:    { type: Date, default: null },

    // ── Audit trail ────────────────────────────────────────────────────────
    previous_status: { type: String, default: null },
    updated_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updated_at:      { type: Date, default: null },

    // ── Student preferences ────────────────────────────────────────────────
    starred: { type: Boolean, default: false },
    notes:   { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Unique constraint: a student can only apply once per drive
studentApplicationSchema.index({ drive: 1, student: 1 }, { unique: true });
// Performance indexes
studentApplicationSchema.index({ student: 1 });
studentApplicationSchema.index({ drive: 1 });
studentApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('StudentApplication', studentApplicationSchema);
