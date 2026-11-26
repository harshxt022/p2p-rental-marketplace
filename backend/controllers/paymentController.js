const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const { scopeBookingForUser } = require('../utils/bookingHelpers');
const { createAndEmitNotification } = require('../utils/notify');
const { bookingPopulate, emitUpdate } = require('./bookingController');

const getRazorpayClient = () => {
  return new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET
  });
};

const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the renter can initiate payment' });
    }
    if (booking.status !== 'LIVE') {
      return res.status(400).json({ message: 'Payment is only allowed when booking is LIVE' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: 'INR',
      receipt: String(booking._id)
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RZP_KEY_ID
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the renter can verify payment' });
    }
    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order ID mismatch' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    booking.isPaid = true;
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.timeline.push({
      title: 'Payment Verified (Razorpay)',
      description: `₹${booking.totalAmount} paid via Razorpay (${razorpay_payment_id}).`,
      timestamp: new Date()
    });
    await booking.save();

    const populated = await Booking.findById(booking._id).populate(bookingPopulate);
    emitUpdate(req, populated);
    await createAndEmitNotification(req, {
      userId: booking.owner,
      type: 'PAYMENT_VERIFIED',
      title: 'Payment Received',
      message: `₹${booking.totalAmount} paid via Razorpay for ${populated.item?.title || 'item'}. Return OTP is ready.`,
      link: `/booking/${booking._id}`,
      bookingId: booking._id
    });
    return res.status(200).json({ booking: scopeBookingForUser(populated, req.user._id) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, verifyPayment };
