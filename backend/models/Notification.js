const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    link: { type: String, required: true, trim: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
