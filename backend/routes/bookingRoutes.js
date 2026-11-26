const express = require('express');
const {
  getBookedDates,
  createBooking,
  getMyBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  verifyHandover,
  verifyReturn,
  fastForwardBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/item/:itemId/booked-dates', getBookedDates);
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/approve', protect, approveBooking);
router.patch('/:id/reject', protect, rejectBooking);
router.post('/:id/verify-handover', protect, verifyHandover);
router.post('/:id/verify-return', protect, verifyReturn);
router.post('/:id/fast-forward', protect, fastForwardBooking);

module.exports = router;
