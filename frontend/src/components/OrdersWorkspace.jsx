import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  X,
  BadgeCheck,
  MessageSquare,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  CreditCard,
  ShieldCheck,
  Star
} from 'lucide-react';
import api from '../services/api';
import { getImageUrl } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  STATUS_META,
  calcRentalProgress,
  getBookingTimeline,
  getInitials
} from '../utils/rentalProgress';
import Navbar from './Navbar';
import Footer from './Footer';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'LIVE', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' }
];

export default function OrdersWorkspace({ mode }) {
  const isOwnerMode = mode === 'owner';
  const { user, openAuthModal } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => searchParams.get('bookingId') || '');
  const [drawerOtp, setDrawerOtp] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const queryBookingId = searchParams.get('bookingId');
    if (queryBookingId) {
      setSelectedId(queryBookingId);
    }
  }, [searchParams]);

  const loadBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(isOwnerMode ? data.asOwner || [] : data.asRenter || []);
    } finally {
      setLoading(false);
    }
  }, [user, isOwnerMode]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_updated', loadBookings);
    return () => socket.off('booking_updated', loadBookings);
  }, [socket, loadBookings]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const peer = isOwnerMode ? booking.renter : booking.owner;
      const orderCode = booking._id.slice(-6).toLowerCase();
      return (
        orderCode.includes(query) ||
        (booking.item?.title || '').toLowerCase().includes(query) ||
        (booking.item?.city || '').toLowerCase().includes(query) ||
        (peer?.name || '').toLowerCase().includes(query)
      );
    });
  }, [bookings, statusFilter, searchQuery, isOwnerMode]);

  const selectedBooking = useMemo(() => {
    if (!selectedId) return null;
    return bookings.find((b) => b._id === selectedId) || null;
  }, [selectedId, bookings]);

  const selectedPeer = useMemo(() => {
    if (!selectedBooking) return null;
    return isOwnerMode ? selectedBooking.renter : selectedBooking.owner;
  }, [selectedBooking, isOwnerMode]);

  const closeDrawer = () => {
    setSelectedId('');
    setDrawerOtp('');
    setActionError('');
    if (searchParams.get('bookingId')) {
      setSearchParams({});
    }
  };

  const handleDecision = async (bookingId, action) => {
    setActionError('');
    setSubmitting(true);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      await loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionError('');
    setSubmitting(true);
    try {
      await api.post(`/bookings/${selectedBooking._id}/verify-handover`, { otp: drawerOtp });
      setDrawerOtp('');
      await loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Invalid handover OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!selectedBooking) return;
    setActionError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/payments/create-order', { bookingId: selectedBooking._id });
      if (!window.Razorpay) {
        setActionError('Razorpay SDK failed to load');
        setSubmitting(false);
        return;
      }
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'RentMate',
        description: selectedBooking.item?.title || 'Rental Checkout',
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
              bookingId: selectedBooking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await loadBookings();
          } catch (verifyErr) {
            setActionError(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setActionError(resp.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not initiate Razorpay order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReturn = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionError('');
    setSubmitting(true);
    try {
      await api.post(`/bookings/${selectedBooking._id}/verify-return`, { otp: drawerOtp });
      setDrawerOtp('');
      await loadBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Invalid return OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChat = async () => {
    if (!selectedBooking || !selectedPeer) return;
    setActionError('');
    try {
      const { data } = await api.post('/chats', {
        participantId: selectedPeer._id,
        itemId: selectedBooking.item?._id
      });
      navigate(`/chats?id=${data.conversation._id}`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to start chat');
    }
  };

  const pageTitle = isOwnerMode ? 'Incoming Orders' : 'My Rentals';
  const pageSubtitle = isOwnerMode
    ? 'Approve requests, verify handover OTPs, and share return OTPs for your gear.'
    : 'Track your rental requests, view handover OTPs, pay via Razorpay, and verify returns.';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-14 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">{pageTitle}</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">{pageSubtitle}</p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md"
            >
              Login / Sign Up
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-headline-lg text-on-surface">{pageTitle}</h1>
                <p className="text-body-md text-on-surface-variant">{pageSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start">
                <Link
                  to={isOwnerMode ? '/my-rentals' : '/incoming-orders'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors"
                >
                  <span>{isOwnerMode ? 'My Rentals' : 'Incoming Orders'}</span>
                  <ArrowRight className="w-4 h-4 text-primary-container" />
                </Link>
                <Link
                  to="/my-ads"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors"
                >
                  <span>My Ads</span>
                </Link>
              </div>
            </div>

            {actionError && !selectedBooking && (
              <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                {actionError}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-3.5 py-1.5 rounded-full text-label-md border transition-all ${
                        active
                          ? 'bg-primary-fixed text-primary border-primary-container'
                          : 'bg-surface-container-lowest text-on-surface-variant border-surface-container hover:text-on-surface'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 border border-surface-container lg:w-80 focus-within:border-primary-container">
                <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search #ID, item, city, peer..."
                  className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="h-64 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
            ) : filteredOrders.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center text-on-surface-variant">
                No {isOwnerMode ? 'incoming orders' : 'rentals'} match your filters.
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
                      <th className="py-3.5 px-5">Order ID</th>
                      <th className="py-3.5 px-5">Item & City</th>
                      <th className="py-3.5 px-5">{isOwnerMode ? 'Renter' : 'Owner'}</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Rental Period</th>
                      <th className="py-3.5 px-5 text-right">Total</th>
                      {isOwnerMode && <th className="py-3.5 px-5 text-right">Quick Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredOrders.map((booking) => {
                      const peer = isOwnerMode ? booking.renter : booking.owner;
                      const meta = STATUS_META[booking.status] || {
                        label: booking.status,
                        badgeClass: 'bg-surface-container text-on-surface'
                      };
                      const isSelected = selectedId === booking._id;
                      return (
                        <tr
                          key={booking._id}
                          onClick={() => {
                            setActionError('');
                            setDrawerOtp('');
                            setSelectedId(booking._id);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-fixed/25' : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="py-4 px-5 font-mono text-label-md text-on-surface">
                            #{booking._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-label-md text-on-surface line-clamp-1">
                              {booking.item?.title || 'Item'}
                            </p>
                            <p className="text-body-sm text-on-surface-variant">
                              {booking.item?.city || ''}
                            </p>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-1.5 text-body-md text-on-surface">
                              <span>{peer?.name || 'Peer'}</span>
                              {peer?.isVerified && (
                                <BadgeCheck className="w-4 h-4 text-secondary shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-label-sm ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-body-sm text-on-surface-variant">
                            {format(new Date(booking.startDate), 'dd MMM')} →{' '}
                            {format(new Date(booking.endDate), 'dd MMM yyyy')}
                          </td>
                          <td className="py-4 px-5 text-right text-price-md text-on-surface">
                            ₹{booking.totalAmount}
                          </td>
                          {isOwnerMode && (
                            <td
                              className="py-4 px-5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {booking.status === 'PENDING' ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleDecision(booking._id, 'approve')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-label-sm hover:opacity-95 disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => handleDecision(booking._id, 'reject')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-label-sm disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(booking._id)}
                                  className="text-label-sm text-primary hover:underline"
                                >
                                  Open Drawer
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs" onClick={closeDrawer} />
          <aside className="relative z-10 w-full max-w-md bg-surface-container-lowest h-full shadow-[0_20px_32px_-8px_rgba(41,37,36,0.22)] border-l border-surface-container flex flex-col">
            <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div>
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {isOwnerMode ? 'Owner Order Drawer' : 'Renter Order Drawer'}
                </p>
                <h2 className="text-headline-md text-on-surface font-mono">
                  Order #{selectedBooking._id.slice(-6).toUpperCase()}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/booking/${selectedBooking._id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-sm hover:brightness-95"
                >
                  <span>Full View</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {actionError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {actionError}
                </div>
              )}

              <div className="p-4 rounded-2xl border border-primary-container/40 bg-primary-fixed/20 space-y-3">
                {selectedBooking.status === 'PENDING' && (
                  <>
                    <p className="text-label-md text-on-surface">
                      {isOwnerMode
                        ? 'Action Required: Approve or reject this request'
                        : 'Awaiting Owner Approval'}
                    </p>
                    {isOwnerMode && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDecision(selectedBooking._id, 'approve')}
                          className="flex-1 py-2.5 rounded-full bg-secondary text-on-secondary text-label-md"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDecision(selectedBooking._id, 'reject')}
                          className="flex-1 py-2.5 rounded-full bg-error-container text-on-error-container text-label-md"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                )}

                {selectedBooking.status === 'REJECTED' && (
                  <p className="text-label-md text-error">Booking Request Declined</p>
                )}

                {selectedBooking.status === 'APPROVED' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <KeyRound className="w-4 h-4" />
                      <span className="text-label-md">Handover OTP Verification</span>
                    </div>
                    {isOwnerMode ? (
                      <form onSubmit={handleVerifyHandover} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={drawerOtp}
                          onChange={(e) => setDrawerOtp(e.target.value)}
                          placeholder="4-digit OTP"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-headline-sm tracking-widest focus:outline-none focus:border-primary-container"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-label-md"
                        >
                          {submitting ? '...' : 'Verify'}
                        </button>
                      </form>
                    ) : (
                      <div className="p-3 rounded-xl bg-surface-container-lowest border border-primary-container text-center">
                        <p className="text-body-sm text-on-surface-variant">
                          Share this Handover OTP with owner at pickup:
                        </p>
                        <p className="text-headline-lg font-mono tracking-[0.35em] text-primary mt-1">
                          {selectedBooking.handoverOtp}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedBooking.status === 'LIVE' && !selectedBooking.isPaid && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-label-md">Payment Required (Razorpay)</span>
                    </div>
                    {isOwnerMode ? (
                      <p className="text-body-sm text-on-surface-variant">
                        Item is LIVE. Waiting for renter to pay ₹{selectedBooking.totalAmount}.
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleRazorpayCheckout}
                        className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)]"
                      >
                        {submitting
                          ? 'Opening Razorpay...'
                          : `Pay ₹${selectedBooking.totalAmount} Now`}
                      </button>
                    )}
                  </div>
                )}

                {selectedBooking.status === 'LIVE' && selectedBooking.isPaid && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-secondary">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-label-md">Return OTP Verification</span>
                    </div>
                    {isOwnerMode ? (
                      <div className="p-3 rounded-xl bg-surface-container-lowest border border-secondary text-center">
                        <p className="text-body-sm text-on-surface-variant">
                          Share this Return OTP with renter on safe return:
                        </p>
                        <p className="text-headline-lg font-mono tracking-[0.35em] text-secondary mt-1">
                          {selectedBooking.returnOtp}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyReturn} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={drawerOtp}
                          onChange={(e) => setDrawerOtp(e.target.value)}
                          placeholder="4-digit Return OTP"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-headline-sm tracking-widest focus:outline-none focus:border-primary-container"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-label-md"
                        >
                          {submitting ? '...' : 'Complete'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {selectedBooking.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-label-md text-secondary">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                    <Link
                      to={`/booking/${selectedBooking._id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant text-label-sm text-on-surface hover:bg-primary-fixed/40"
                    >
                      <Star className="w-3.5 h-3.5 text-primary-container" />
                      Leave Review
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-label-md font-bold shrink-0">
                    {getInitials(selectedPeer?.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-headline-sm text-on-surface truncate">
                        {selectedPeer?.name || 'Peer'}
                      </p>
                      {selectedPeer?.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-secondary shrink-0" />
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-container" />
                      {selectedPeer?.city || selectedBooking.item?.city}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 shrink-0"
                >
                  <MessageSquare className="w-4 h-4 text-primary-container" />
                  <span>Chat</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-surface-container bg-surface-container-lowest space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-md text-on-surface">Rental Period Progress</span>
                  <span className="text-headline-sm text-primary font-bold">
                    {calcRentalProgress(selectedBooking)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-container transition-all duration-300"
                    style={{ width: `${calcRentalProgress(selectedBooking)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-body-sm">
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <p className="text-on-surface-variant">Picked Up</p>
                    <p className="text-label-md text-on-surface">
                      {format(new Date(selectedBooking.startDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <p className="text-on-surface-variant">Return</p>
                    <p className="text-label-md text-on-surface">
                      {format(new Date(selectedBooking.endDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-surface-container bg-surface-container-lowest flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedBooking.item?.images?.[0] ? (
                    <img
                      src={getImageUrl(selectedBooking.item.images[0])}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-outline" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-headline-sm text-on-surface truncate">
                    {selectedBooking.item?.title}
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    ₹{selectedBooking.item?.dailyRate}/day • Deposit ₹{selectedBooking.securityDeposit}
                  </p>
                  <p className="text-price-md text-on-surface mt-0.5">
                    Total ₹{selectedBooking.totalAmount}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-label-md uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-container" />
                  Recent Activity
                </h3>
                <div className="space-y-3 border-l-2 border-surface-container-highest pl-4 ml-1.5">
                  {getBookingTimeline(selectedBooking)
                    .slice()
                    .reverse()
                    .slice(0, 4)
                    .map((event, idx) => (
                      <div key={`${event.title}-${idx}`} className="relative">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-container absolute -left-[21px] top-1.5" />
                        <p className="text-label-md text-on-surface">{event.title}</p>
                        {event.description && (
                          <p className="text-body-sm text-on-surface-variant">{event.description}</p>
                        )}
                        <p className="text-[11px] text-outline mt-0.5">
                          {format(new Date(event.timestamp), 'dd MMM, hh:mm a')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Footer />
    </div>
  );
}
