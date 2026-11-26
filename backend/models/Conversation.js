const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    lastMessage: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
