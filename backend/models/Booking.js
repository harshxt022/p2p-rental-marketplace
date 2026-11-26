const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    rentAmount: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'LIVE', 'COMPLETED', 'REJECTED'],
      default: 'PENDING'
    },
    handoverOtp: { type: String, default: '' },
    returnOtp: { type: String, default: '' },
    isPaid: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    demoOffsetHours: { type: Number, default: 0 },
    timeline: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
