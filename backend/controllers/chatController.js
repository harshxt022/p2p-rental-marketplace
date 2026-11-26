const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const conversationPopulate = [
  { path: 'participants', select: 'name city isVerified' },
  { path: 'item', select: 'title images dailyRate city' }
];

const findOrCreateConversation = async (req, res) => {
  try {
    const { participantId, itemId } = req.body;
    if (!participantId || !itemId) {
      return res.status(400).json({ message: 'participantId and itemId are required' });
    }
    if (participantId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      item: itemId,
      participants: { $all: [req.user._id, participantId], $size: 2 }
    }).populate(conversationPopulate);

    if (!conversation) {
      const created = await Conversation.create({
        participants: [req.user._id, participantId],
        item: itemId,
        lastMessage: ''
      });
      conversation = await Conversation.findById(created._id).populate(conversationPopulate);
    }

    return res.status(200).json({ conversation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate(conversationPopulate)
      .sort({ updatedAt: -1 });
    return res.status(200).json({ conversations });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const uid = req.user._id.toString();
    const isParticipant = conversation.participants.some((p) => p.toString() === uid);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to send messages here' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim()
    });

    conversation.lastMessage = text.trim();
    conversation.updatedAt = new Date();
    await conversation.save();

    const populated = await message.populate('sender', 'name');
    const io = req.app.get('io');
    if (io) {
      const recipient = conversation.participants.find((p) => p.toString() !== uid);
      let emitter = io.to(`chat:${conversation._id.toString()}`);
      if (recipient) {
        emitter = emitter.to(`user:${recipient.toString()}`);
      }
      emitter.emit('new_message', {
        conversationId: conversation._id.toString(),
        message: populated
      });
    }

    return res.status(201).json({ message: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  findOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage
};
