const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');

const createReview = async (req, res) => {
  try {
    const { bookingId, itemRating, userRating, comment } = req.body;
    if (!bookingId || !itemRating || !userRating) {
      return res.status(400).json({ message: 'bookingId, itemRating, and userRating are required' });
    }

    const numericItemRating = Number(itemRating);
    const numericUserRating = Number(userRating);
    if (numericItemRating < 1 || numericItemRating > 5 || numericUserRating < 1 || numericUserRating > 5) {
      return res.status(400).json({ message: 'Ratings must be between 1 and 5' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Reviews can only be submitted after COMPLETED status' });
    }

    const uid = req.user._id.toString();
    const isRenter = booking.renter.toString() === uid;
    const isOwner = booking.owner.toString() === uid;
    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    const existing = await Review.findOne({ booking: booking._id, reviewer: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this booking' });
    }

    const reviewee = isRenter ? booking.owner : booking.renter;
    const review = await Review.create({
      booking: booking._id,
      reviewer: req.user._id,
      reviewee,
      item: booking.item,
      itemRating: numericItemRating,
      userRating: numericUserRating,
      comment: typeof comment === 'string' ? comment.trim() : ''
    });

    await User.findByIdAndUpdate(reviewee, {
      $inc: { ratingSum: numericUserRating, ratingCount: 1 }
    });

    const populated = await review.populate('reviewer', 'name');
    return res.status(201).json({ review: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getItemReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ reviews });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getItemReviews };
