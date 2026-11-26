const Booking = require('../models/Booking');
const Item = require('../models/Item');
const Review = require('../models/Review');
const { createAndEmitNotification } = require('../utils/notify');
const {
  normalizeUtcDate,
  getTodayUtc,
  calcBookingAmounts,
  generateOtp,
  scopeBookingForUser
} = require('../utils/bookingHelpers');

const bookingPopulate = [
  { path: 'item', select: 'title images dailyRate securityDeposit city category' },
  { path: 'renter', select: 'name email phone city isVerified ratingSum ratingCount' },
  { path: 'owner', select: 'name email phone city isVerified ratingSum ratingCount' }
];

const emitUpdate = (req, booking) => {
  const emitter = req.app.get('emitBookingUpdate');
  if (emitter) {
    emitter(booking);
  }
};

const pushTimeline = (booking, title, description) => {
  booking.timeline.push({ title, description, timestamp: new Date() });
};

const getBookedDates = async (req, res) => {
  try {
    const bookings = await Booking.find({
      item: req.params.itemId,
      status: { $in: ['APPROVED', 'LIVE'] }
    }).select('startDate endDate');
    return res.status(200).json({ bookedRanges: bookings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.body;
    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({ message: 'itemId, startDate, and endDate are required' });
    }

    const item = await Item.findById(itemId);
    if (!item || !item.isActive) {
      return res.status(404).json({ message: 'Item not found or inactive' });
    }
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot rent your own item' });
    }

    const start = normalizeUtcDate(startDate);
    const end = normalizeUtcDate(endDate);
    if (!start || !end) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (end < start) {
      return res.status(400).json({ message: 'End date must be on or after start date' });
    }
    if (start < getTodayUtc()) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    const overlap = await Booking.findOne({
      item: item._id,
      status: { $in: ['APPROVED', 'LIVE'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    if (overlap) {
      return res.status(409).json({ message: 'Selected dates overlap an existing booking' });
    }

    const amounts = calcBookingAmounts(start, end, item.dailyRate, item.securityDeposit);
    const booking = await Booking.create({
      item: item._id,
      renter: req.user._id,
      owner: item.owner,
      startDate: start,
      endDate: end,
      days: amounts.days,
      rentAmount: amounts.rentAmount,
      securityDeposit: amounts.securityDeposit,
      totalAmount: amounts.totalAmount,
      status: 'PENDING',
      timeline: [
        {
          title: 'Rental Requested',
          description: `Booking request submitted for ${amounts.days} ${amounts.days === 1 ? 'day' : 'days'}.`,
          timestamp: new Date()
        }
      ]
    });

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: item.owner,
      type: 'BOOKING_REQUEST',
      title: 'New Rental Request',
      message: `${req.user.name} requested ${item.title} (${amounts.days} ${amounts.days === 1 ? 'day' : 'days'}).`,
      link: '/incoming-orders',
      bookingId: booking._id
    });
    return res.status(201).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const [renterDocs, ownerDocs] = await Promise.all([
      Booking.find({ renter: req.user._id }).populate(bookingPopulate).sort({ createdAt: -1 }),
      Booking.find({ owner: req.user._id }).populate(bookingPopulate).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      asRenter: renterDocs.map((b) => scopeBookingForUser(b, req.user._id)),
      asOwner: ownerDocs.map((b) => scopeBookingForUser(b, req.user._id))
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(bookingPopulate);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const uid = req.user._id.toString();
    if (booking.renter._id.toString() !== uid && booking.owner._id.toString() !== uid) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    const existingReview = await Review.findOne({ booking: booking._id, reviewer: req.user._id });
    return res.status(200).json({
      booking: scopeBookingForUser(booking, req.user._id),
      hasReviewed: Boolean(existingReview)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can approve this booking' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING bookings can be approved' });
    }

    const overlap = await Booking.findOne({
      _id: { $ne: booking._id },
      item: booking.item,
      status: { $in: ['APPROVED', 'LIVE'] },
      startDate: { $lte: booking.endDate },
      endDate: { $gte: booking.startDate }
    });
    if (overlap) {
      return res.status(409).json({ message: 'Dates overlap another approved or live booking' });
    }

    booking.handoverOtp = generateOtp();
    booking.returnOtp = generateOtp();
    booking.status = 'APPROVED';
    pushTimeline(
      booking,
      'Booking Approved',
      'Owner approved the request and generated handover & return OTPs.'
    );
    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: booking.renter,
      type: 'BOOKING_APPROVED',
      title: 'Booking Approved',
      message: `Your request for ${populated.item?.title || 'item'} was approved. Handover OTP is ready.`,
      link: '/my-rentals',
      bookingId: booking._id
    });
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can reject this booking' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING bookings can be rejected' });
    }

    booking.status = 'REJECTED';
    pushTimeline(booking, 'Booking Rejected', 'Owner declined the booking request.');
    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: booking.renter,
      type: 'BOOKING_REJECTED',
      title: 'Booking Declined',
      message: `Your request for ${populated.item?.title || 'item'} was declined by the owner.`,
      link: '/my-rentals',
      bookingId: booking._id
    });
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const verifyHandover = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can verify handover OTP' });
    }
    if (booking.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Booking must be APPROVED before handover' });
    }
    const otp = String(req.body.otp || '').trim();
    if (!otp || otp !== booking.handoverOtp) {
      return res.status(400).json({ message: 'Invalid handover OTP' });
    }

    booking.status = 'LIVE';
    pushTimeline(
      booking,
      'Handover Verified',
      'Owner verified the handover OTP. Rental is now active.'
    );
    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: booking.renter,
      type: 'HANDOVER_LIVE',
      title: 'Handover Verified — Rental Live',
      message: `Handover OTP verified for ${populated.item?.title || 'item'}. Proceed to payment.`,
      link: `/booking/${booking._id}`,
      bookingId: booking._id
    });
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const verifyReturn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the renter can verify return OTP' });
    }
    if (booking.status !== 'LIVE') {
      return res.status(400).json({ message: 'Booking must be LIVE before return' });
    }
    if (!booking.isPaid) {
      return res.status(400).json({ message: 'Payment must be completed before return verification' });
    }
    const otp = String(req.body.otp || '').trim();
    if (!otp || otp !== booking.returnOtp) {
      return res.status(400).json({ message: 'Invalid return OTP' });
    }

    booking.status = 'COMPLETED';
    pushTimeline(
      booking,
      'Return Verified & Completed',
      'Renter verified the return OTP. Rental closed and security deposit released.'
    );
    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: booking.owner,
      type: 'RETURN_COMPLETED',
      title: 'Rental Completed',
      message: `Return OTP verified for ${populated.item?.title || 'item'}. Order completed.`,
      link: `/booking/${booking._id}`,
      bookingId: booking._id
    });
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const fastForwardBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const uid = req.user._id.toString();
    if (booking.renter.toString() !== uid && booking.owner.toString() !== uid) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    if (booking.status !== 'LIVE') {
      return res.status(400).json({ message: 'Time-travel is only available when booking is LIVE' });
    }

    const { mode } = req.body;
    const totalDurationMs = Math.max(1, booking.days || 1) * 24 * 3600000;
    const startMs = new Date(booking.startDate).getTime();
    const nowMs = Date.now();

    if (mode === 'day') {
      booking.demoOffsetHours = Number(((booking.demoOffsetHours || 0) + 24).toFixed(2));
      pushTimeline(booking, 'Demo Time-Travel (+24h)', 'Simulated rental clock advanced by 24 hours.');
    } else if (mode === 'half') {
      const targetMs = startMs + totalDurationMs * 0.5;
      booking.demoOffsetHours = Math.max(0, Number(((targetMs - nowMs) / 3600000).toFixed(2)));
      pushTimeline(booking, 'Demo Time-Travel (50%)', 'Simulated rental clock jumped to 50% duration.');
    } else if (mode === 'end') {
      const targetMs = startMs + totalDurationMs;
      booking.demoOffsetHours = Math.max(0, Number(((targetMs - nowMs) / 3600000).toFixed(2)));
      pushTimeline(booking, 'Demo Time-Travel (100%)', 'Simulated rental clock jumped to return window.');
    } else {
      return res.status(400).json({ message: 'Invalid fast-forward mode' });
    }

    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBookedDates,
  createBooking,
  getMyBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  verifyHandover,
  verifyReturn,
  fastForwardBooking,
  bookingPopulate,
  emitUpdate
};
