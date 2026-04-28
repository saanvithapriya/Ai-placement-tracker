const mongoose = require('mongoose');

/**
 * Notification — created by the system when admin moves a student's status.
 * The student sees these in the notification bell.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentApplication',
      index: true,
    },
    // Denormalised for quick display — no extra DB query needed
    company: { type: String, default: '' },
    role:    { type: String, default: '' },

    type: {
      type: String,
      enum: ['shortlisted', 'interview', 'offer', 'rejected'],
      required: true,
    },

    message: { type: String, required: true },
    read:    { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
