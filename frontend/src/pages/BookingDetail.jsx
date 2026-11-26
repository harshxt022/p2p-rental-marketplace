import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FastForward,
  KeyRound,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  ShieldCheck,
  Star
} from 'lucide-react';
import api from '../services/api';
import { formatRating, getImageUrl } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  STATUS_META,
  calcRentalProgress,
  getBookingTimeline,
  getInitials
} from '../utils/rentalProgress';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const socket = useSocket();

  const [booking, setBooking] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ itemRating: 5, userRating: 5, comment: '' });

  const fetchBooking = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/bookings/${id}`);
      setBooking(data.booking);
      setHasReviewed(Boolean(data.hasReviewed));
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_booking', id);
    const handleUpdate = (payload) => {
      if (payload?.bookingId === id) {
        fetchBooking();
      }
    };
    socket.on('booking_updated', handleUpdate);
    return () => {
      socket.emit('leave_booking', id);
      socket.off('booking_updated', handleUpdate);
    };
  }, [socket, id, fetchBooking]);

  const handleDecision = async (action) => {
    setError('');
    setSubmitting(true);
    try {
      await api.patch(`/bookings/${id}/${action}`);
      await fetchBooking();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFastForward = async (mode) => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bookings/${id}/fast-forward`, { mode });
      setBooking(data.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fast-forward booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/bookings/${id}/verify-handover`, { otp: otpInput });
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid handover OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/payments/create-order', { bookingId: id });
      if (!window.Razorpay) {
        setError('Razorpay SDK failed to load');
        setSubmitting(false);
        return;
      }
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'RentMate',
        description: booking.item?.title || 'Rental Checkout',
        order_id: data.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              bookingId: id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await fetchBooking();
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate Razorpay order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReturn = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/bookings/${id}/verify-return`, { otp: otpInput });
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid return OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId: id, ...reviewForm });
      setHasReviewed(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user && booking?.owner?._id === user._id;
  const isRenter = user && booking?.renter?._id === user._id;
  const peer = isOwner ? booking?.renter : booking?.owner;

  const handleOpenChat = async () => {
    if (!booking || !peer) return;
    try {
      const { data } = await api.post('/chats', {
        participantId: peer._id,
        itemId: booking.item?._id
      });
      navigate(`/chats?id=${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open chat');
    }
  };

  const progressPct = useMemo(() => calcRentalProgress(booking), [booking]);
  const timeline = useMemo(() => getBookingTimeline(booking), [booking]);
  const statusMeta = STATUS_META[booking?.status] || {
    label: booking?.status || '',
    badgeClass: 'bg-surface-container text-on-surface'
  };

  const baseRent = booking ? (booking.item?.dailyRate || 0) * (booking.days || 1) : 0;
  const discount = booking && booking.days >= 7 ? baseRent - booking.rentAmount : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">Order Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">
              Please sign in to access this booking.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md"
            >
              Login
            </button>
          </div>
        ) : loading ? (
          <div className="h-80 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
        ) : !booking ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-md text-on-surface">Booking not found or unauthorized</h1>
            <Link to="/my-orders" className="inline-block mt-4 text-label-md text-primary underline">
              Back to My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={isOwner ? '/incoming-orders' : '/my-rentals'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container-low text-label-md text-on-surface hover:bg-surface-container"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Orders</span>
                </Link>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-headline-md text-on-surface font-mono">
                      Order #{booking._id.slice(-6).toUpperCase()}
                    </h1>
                    <span className={`px-3 py-0.5 rounded-full text-label-sm ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-0.5 flex flex-wrap items-center gap-3">
                    <span>Created {format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-container" />
                      Pickup City: {booking.item?.city}
                    </span>
                  </p>
                </div>
              </div>

              {booking.status === 'LIVE' && (
                <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-2 rounded-2xl border border-surface-container">
                  <span className="inline-flex items-center gap-1.5 px-2.5 text-label-sm uppercase tracking-wider text-primary">
                    <FastForward className="w-4 h-4" />
                    Demo Time-Travel
                  </span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFastForward('day')}
                    className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-label-md text-on-surface hover:bg-primary-fixed/40 disabled:opacity-50"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFastForward('half')}
                    className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-label-md text-on-surface hover:bg-primary-fixed/40 disabled:opacity-50"
                  >
                    50% Progress
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFastForward('end')}
                    className="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-sm hover:brightness-95 disabled:opacity-50"
                  >
                    Jump to Return 100%
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-body-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 flex flex-col justify-between">
                <div>
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-4">
                    {isOwner ? 'Renter Info' : 'Owner Info'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-headline-sm font-bold shrink-0">
                      {getInitials(peer?.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-headline-sm text-on-surface truncate">{peer?.name}</h2>
                        {peer?.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Verified Peer
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {formatRating(peer)} • {peer?.city}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-body-sm text-on-surface-variant flex items-center gap-2">
                    <Phone className="w-4 h-4 text-outline" />
                    <span>{peer?.phone || 'Phone not provided'}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-primary-container" />
                  <span>Message Peer</span>
                </button>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Rental Period
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-display font-extrabold text-on-surface">{progressPct}%</span>
                    <span className="text-body-sm text-on-surface-variant">
                      {booking.days} {booking.days === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-container transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <p className="text-body-sm text-on-surface-variant">Picked Up</p>
                    <p className="text-label-md text-on-surface">
                      {format(new Date(booking.startDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low">
                    <p className="text-body-sm text-on-surface-variant">Return</p>
                    <p className="text-label-md text-on-surface">
                      {format(new Date(booking.endDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5 flex flex-col justify-between">
                <div>
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-4">
                    Payments & Deposit Ledger
                  </p>
                  <div className="space-y-3 text-body-md">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Rent Paid (Razorpay)</span>
                      <span className="text-label-md text-on-surface">
                        {booking.isPaid ? `₹${booking.rentAmount}` : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Security Deposit Held</span>
                      <span className="text-label-md text-on-surface">
                        ₹{booking.isPaid ? booking.securityDeposit : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant">Deposit Refunded</span>
                      <span
                        className={`text-label-md ${
                          booking.status === 'COMPLETED' ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      >
                        {booking.status === 'COMPLETED'
                          ? `Refunded (₹${booking.securityDeposit})`
                          : 'Held until return'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-container flex items-center justify-between">
                  <span className="text-label-md text-on-surface">Balance Due</span>
                  <span className="text-price-lg text-on-surface">
                    ₹{booking.isPaid || booking.status === 'REJECTED' ? 0 : booking.totalAmount}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                  <div className="flex items-center gap-4 pb-5 border-b border-surface-container">
                    <div className="w-20 h-20 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {booking.item?.images?.[0] ? (
                        <img
                          src={getImageUrl(booking.item.images[0])}
                          alt={booking.item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-outline" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-label-sm uppercase tracking-wider text-primary-container">
                        {booking.item?.category}
                      </span>
                      <h2 className="text-headline-md text-on-surface truncate">
                        {booking.item?.title}
                      </h2>
                      <p className="text-body-sm text-on-surface-variant">{booking.item?.city}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 text-body-md">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        Daily Rate × Days (₹{booking.item?.dailyRate} × {booking.days})
                      </span>
                      <span>₹{baseRent}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-secondary font-semibold">
                        <span>10% Multi-day Discount (7+ days)</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Security Deposit (Refundable)</span>
                      <span>₹{booking.securityDeposit}</span>
                    </div>
                    <div className="pt-3 border-t border-surface-container flex justify-between text-headline-sm text-on-surface font-bold">
                      <span>Grand Total</span>
                      <span>₹{booking.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                  {booking.status === 'PENDING' && (
                    <div className="text-center py-2">
                      <h3 className="text-headline-md text-on-surface">
                        {isOwner ? 'Review Rental Request' : 'Awaiting Owner Approval'}
                      </h3>
                      <p className="text-body-md text-on-surface-variant mt-1">
                        {isOwner
                          ? `${booking.renter?.name} requested this item for ₹${booking.totalAmount}.`
                          : 'Once the owner approves, your handover OTP will appear here.'}
                      </p>
                      {isOwner && (
                        <div className="flex justify-center gap-3 mt-5">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleDecision('approve')}
                            className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary text-label-md"
                          >
                            Approve Request
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleDecision('reject')}
                            className="px-6 py-2.5 rounded-full bg-error-container text-on-error-container text-label-md"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === 'REJECTED' && (
                    <div className="text-center py-2 text-error">
                      <h3 className="text-headline-md">Booking Request Rejected</h3>
                    </div>
                  )}

                  {booking.status === 'APPROVED' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary-container">
                        <KeyRound className="w-5 h-5" />
                        <h3 className="text-headline-md text-on-surface">
                          Step 1: Handover Verification
                        </h3>
                      </div>

                      {isRenter ? (
                        <div className="p-6 rounded-xl bg-primary-fixed/40 border border-primary-container text-center">
                          <p className="text-body-md text-on-surface">
                            Share this 4-digit Handover OTP with{' '}
                            <strong>{booking.owner?.name}</strong> at pickup:
                          </p>
                          <p className="text-display font-mono tracking-[0.35em] text-primary mt-2">
                            {booking.handoverOtp}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleVerifyHandover} className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            maxLength={4}
                            required
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Enter 4-digit Handover OTP"
                            className="flex-1 px-4 py-3 rounded-xl border border-outline-variant text-headline-sm tracking-widest focus:outline-none focus:border-primary-container"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)]"
                          >
                            {submitting ? 'Verifying...' : 'Verify & Start Rental'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {booking.status === 'LIVE' && !booking.isPaid && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary-container">
                        <CreditCard className="w-5 h-5" />
                        <h3 className="text-headline-md text-on-surface">
                          Step 2: Razorpay Checkout
                        </h3>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-body-sm text-on-surface-variant">
                            Rent ₹{booking.rentAmount} + Deposit ₹{booking.securityDeposit}
                          </p>
                          <p className="text-price-lg text-on-surface">Total ₹{booking.totalAmount}</p>
                        </div>
                        {isRenter ? (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={handleRazorpayCheckout}
                            className="px-6 py-3 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95"
                          >
                            {submitting ? 'Opening Razorpay...' : `Pay ₹${booking.totalAmount} Now`}
                          </button>
                        ) : (
                          <span className="px-4 py-2 rounded-full bg-surface-container text-label-md text-on-surface-variant">
                            Awaiting Renter Payment
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.status === 'LIVE' && booking.isPaid && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-secondary">
                        <ShieldCheck className="w-5 h-5" />
                        <h3 className="text-headline-md text-on-surface">
                          Step 3: Return OTP Verification
                        </h3>
                      </div>

                      {isOwner ? (
                        <div className="p-6 rounded-xl bg-secondary-container/40 border border-secondary text-center">
                          <p className="text-body-md text-on-surface">
                            Payment verified! Share this 4-digit Return OTP with{' '}
                            <strong>{booking.renter?.name}</strong> on safe return:
                          </p>
                          <p className="text-display font-mono tracking-[0.35em] text-secondary mt-2">
                            {booking.returnOtp}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleVerifyReturn} className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            maxLength={4}
                            required
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Enter 4-digit Return OTP"
                            className="flex-1 px-4 py-3 rounded-xl border border-outline-variant text-headline-sm tracking-widest focus:outline-none focus:border-primary-container"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 rounded-xl bg-secondary text-on-secondary text-headline-sm"
                          >
                            {submitting ? 'Completing...' : 'Verify Return & Complete'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl bg-secondary-container/40 border border-secondary flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                        <div>
                          <h3 className="text-headline-sm text-on-surface">Rental Completed</h3>
                          <p className="text-body-sm text-on-surface-variant">
                            Handover, Razorpay payment, and return OTP verified.
                          </p>
                        </div>
                      </div>

                      {hasReviewed ? (
                        <p className="text-body-md text-secondary font-semibold">
                          Thank you! Your review has been recorded.
                        </p>
                      ) : (
                        <form
                          onSubmit={handleSubmitReview}
                          className="p-5 rounded-xl bg-surface-container-low border border-surface-container space-y-4"
                        >
                          <h4 className="text-headline-sm text-on-surface">
                            Rate Your Experience (1–5 Stars)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-label-md text-on-surface mb-1">
                                Item Condition
                              </label>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, itemRating: n })}
                                    className="p-1"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${
                                        n <= reviewForm.itemRating
                                          ? 'text-primary-container fill-primary-container'
                                          : 'text-outline-variant'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-label-md text-on-surface mb-1">
                                {isRenter ? 'Owner Behaviour' : 'Renter Behaviour'}
                              </label>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, userRating: n })}
                                    className="p-1"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${
                                        n <= reviewForm.userRating
                                          ? 'text-primary-container fill-primary-container'
                                          : 'text-outline-variant'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm({ ...reviewForm, comment: e.target.value })
                            }
                            placeholder="Share feedback on item condition and handover..."
                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)]"
                          >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                  <h2 className="text-headline-md text-on-surface mb-5 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-container" />
                    Activity Timeline
                  </h2>
                  <div className="space-y-5 border-l-2 border-surface-container-highest pl-5 ml-2">
                    {timeline
                      .slice()
                      .reverse()
                      .map((event, idx) => (
                        <div key={`${event.title}-${idx}`} className="relative">
                          <span
                            className={`w-3 h-3 rounded-full absolute -left-[27px] top-1.5 border-2 border-surface-container-lowest ${
                              idx === 0 ? 'bg-primary-container' : 'bg-secondary'
                            }`}
                          />
                          <p className="text-label-md text-on-surface">{event.title}</p>
                          {event.description && (
                            <p className="text-body-sm text-on-surface-variant mt-0.5">
                              {event.description}
                            </p>
                          )}
                          <p className="text-[11px] text-outline mt-1">
                            {format(new Date(event.timestamp), 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
