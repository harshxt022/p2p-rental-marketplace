import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckCircle2,
  KeyRound,
  CreditCard,
  Star,
  ShieldCheck,
  MessageSquare,
  Package
} from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BookingWindowPage() {
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

  const handleOpenChat = async () => {
    if (!booking) return;
    const isOwner = user?._id === booking.owner?._id;
    const participantId = isOwner ? booking.renter?._id : booking.owner?._id;
    try {
      const { data } = await api.post('/chats', {
        participantId,
        itemId: booking.item?._id
      });
      navigate(`/chats?id=${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open chat');
    }
  };

  const isOwner = user && booking?.owner?._id === user._id;
  const isRenter = user && booking?.renter?._id === user._id;

  const steps = [
    { label: 'Approved', done: ['APPROVED', 'LIVE', 'COMPLETED'].includes(booking?.status) },
    { label: 'Handover Live', done: ['LIVE', 'COMPLETED'].includes(booking?.status) },
    { label: 'Paid', done: Boolean(booking?.isPaid) },
    { label: 'Completed', done: booking?.status === 'COMPLETED' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 max-w-4xl w-full mx-auto px-margin md:px-margin-tablet">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">Active Rental Window</h1>
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
          <div className="h-72 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
        ) : !booking ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-md text-on-surface">Booking not found or unauthorized</h1>
            <Link to="/my-orders" className="inline-block mt-4 text-label-md text-primary underline">
              Back to My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-container">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                    {booking.item?.images?.[0] ? (
                      <img
                        src={getImageUrl(booking.item.images[0])}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-7 h-7 text-outline" />
                    )}
                  </div>
                  <div>
                    <span className="text-label-sm uppercase tracking-wider text-primary-container">
                      {isOwner ? 'Owner View' : 'Renter View'} • Status: {booking.status}
                    </span>
                    <h1 className="text-headline-md text-on-surface">{booking.item?.title}</h1>
                    <p className="text-body-sm text-on-surface-variant">
                      {format(new Date(booking.startDate), 'dd MMM')} →{' '}
                      {format(new Date(booking.endDate), 'dd MMM yyyy')} ({booking.days} days)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant text-label-md text-on-surface hover:bg-surface-container-low self-start"
                >
                  <MessageSquare className="w-4 h-4 text-primary-container" />
                  Chat with {isOwner ? booking.renter?.name : booking.owner?.name}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                {steps.map((s) => (
                  <div
                    key={s.label}
                    className={`p-3 rounded-xl border flex items-center gap-2 ${
                      s.done
                        ? 'bg-secondary-container/40 border-secondary text-on-secondary-fixed'
                        : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-label-md">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-body-md">
                {error}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
              {booking.status === 'PENDING' && (
                <div className="text-center py-4">
                  <h2 className="text-headline-md text-on-surface">
                    {isOwner ? 'New Rental Request' : 'Awaiting Owner Approval'}
                  </h2>
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
                <div className="text-center py-4 text-error">
                  <h2 className="text-headline-md">Booking Request Rejected</h2>
                </div>
              )}

              {booking.status === 'APPROVED' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-container">
                    <KeyRound className="w-5 h-5" />
                    <h2 className="text-headline-md text-on-surface">Step 1: Handover Verification</h2>
                  </div>

                  {isRenter ? (
                    <div className="p-6 rounded-xl bg-primary-fixed/40 border border-primary-container text-center">
                      <p className="text-body-md text-on-surface">
                        Share this 4-digit Handover OTP with <strong>{booking.owner?.name}</strong>{' '}
                        when picking up the item:
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
                        placeholder="Enter 4-digit Handover OTP from Renter"
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
                    <h2 className="text-headline-md text-on-surface">Step 2: Razorpay Checkout</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-body-md text-on-surface-variant">
                        Rent: ₹{booking.rentAmount} + Security Deposit: ₹{booking.securityDeposit}
                      </p>
                      <p className="text-price-lg text-on-surface">Total: ₹{booking.totalAmount}</p>
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
                    <h2 className="text-headline-md text-on-surface">
                      Step 3: Return OTP Verification
                    </h2>
                  </div>

                  {isOwner ? (
                    <div className="p-6 rounded-xl bg-secondary-container/40 border border-secondary text-center">
                      <p className="text-body-md text-on-surface">
                        Payment verified! Share this 4-digit Return OTP with{' '}
                        <strong>{booking.renter?.name}</strong> once the item is returned safely:
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
                        placeholder="Enter 4-digit Return OTP from Owner"
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
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-secondary-container/40 border border-secondary flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                    <div>
                      <h2 className="text-headline-sm text-on-surface">Rental Completed</h2>
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
                      <h3 className="text-headline-sm text-on-surface">
                        Rate Your Experience (1–5 Stars)
                      </h3>
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
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
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
        )}
      </main>
      <Footer />
    </div>
  );
}
