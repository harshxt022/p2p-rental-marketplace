const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemRating: { type: Number, required: true, min: 1, max: 5 },
    userRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
