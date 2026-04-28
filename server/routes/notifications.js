const express = require('express');
const router  = express.Router();
const Notification = require('../models/Notification');
const { protect }  = require('../middleware/auth');

router.use(protect);

// GET /api/notifications — current user's notifications (unread first)
router.get('/', async (req, res) => {
  const notifs = await Notification.find({ recipient: req.user._id })
    .sort({ read: 1, createdAt: -1 })
    .limit(50)
    .lean();
  const unreadCount = notifs.filter((n) => !n.read).length;
  res.json({ success: true, notifications: notifs, unreadCount });
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  res.json({ success: true });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

module.exports = router;
