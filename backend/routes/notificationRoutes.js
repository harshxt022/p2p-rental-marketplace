const express = require('express');
const {
  listNotifications,
  markAllRead,
  markOneRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);

module.exports = router;
