const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ user: req.user._id, isRead: false })
    ]);
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const markOneRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.status(200).json({ notification });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { listNotifications, markAllRead, markOneRead };
