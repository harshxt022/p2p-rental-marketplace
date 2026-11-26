const express = require('express');
const {
  findOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, findOrCreateConversation);
router.get('/', protect, listConversations);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);

module.exports = router;
