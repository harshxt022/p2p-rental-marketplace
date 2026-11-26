const Notification = require('../models/Notification');

const createAndEmitNotification = async (
  req,
  { userId, type, title, message = '', link, bookingId = null }
) => {
  try {
    if (!userId) return null;
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      bookingId
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId.toString()}`).emit('new_notification', notification);
    }
    return notification;
  } catch {
    return null;
  }
};

module.exports = { createAndEmitNotification };
