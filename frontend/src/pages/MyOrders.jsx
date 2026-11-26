import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Clock
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
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'LIVE', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' }
];

export default function MyOrders() {
  const { user, openAuthModal } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [roleView, setRoleView] = useState('owner');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [asOwner, setAsOwner] = useState([]);
  const [asRenter, setAsRenter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [chatError, setChatError] = useState('');

  const loadBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/bookings/my');
      setAsOwner(data.asOwner || []);
      setAsRenter(data.asRenter || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_updated', loadBookings);
    return () => socket.off('booking_updated', loadBookings);
  }, [socket, loadBookings]);

  const activeList = roleView === 'owner' ? asOwner : asRenter;

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeList.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const peer = roleView === 'owner' ? booking.renter : booking.owner;
      const orderCode = booking._id.slice(-6).toLowerCase();
      return (
        orderCode.includes(query) ||
        (booking.item?.title || '').toLowerCase().includes(query) ||
        (booking.item?.city || '').toLowerCase().includes(query) ||
        (peer?.name || '').toLowerCase().includes(query)
      );
    });
  }, [activeList, statusFilter, searchQuery, roleView]);

  const selectedBooking = useMemo(() => {
    if (!selectedId) return null;
    return [...asOwner, ...asRenter].find((b) => b._id === selectedId) || null;
  }, [selectedId, asOwner, asRenter]);

  const selectedPeer = useMemo(() => {
    if (!selectedBooking || !user) return null;
    return selectedBooking.owner?._id === user._id
      ? selectedBooking.renter
      : selectedBooking.owner;
  }, [selectedBooking, user]);

  const handleOpenChat = async () => {
    if (!selectedBooking || !selectedPeer) return;
    setChatError('');
    try {
      const { data } = await api.post('/chats', {
        participantId: selectedPeer._id,
        itemId: selectedBooking.item?._id
      });
      navigate(`/chats?id=${data.conversation._id}`);
    } catch (err) {
      setChatError(err.response?.data?.message || 'Unable to start chat');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-14 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">My Orders</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">
              Sign in to view incoming requests and active rentals.
            </p>
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
                <h1 className="text-headline-lg text-on-surface">My Orders</h1>
                <p className="text-body-md text-on-surface-variant">
                  Track incoming owner requests and active renter bookings.
                </p>
              </div>
              <Link
                to="/my-ads"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors self-start"
              >
                <span>View My Ads</span>
                <ArrowRight className="w-4 h-4 text-primary-container" />
              </Link>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-4 mb-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="inline-flex p-1 bg-surface-container rounded-full self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleView('owner');
                      setSelectedId('');
                    }}
                    className={`px-4 py-2 rounded-full text-label-md transition-all ${
                      roleView === 'owner'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Incoming Requests (As Owner) ({asOwner.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleView('renter');
                      setSelectedId('');
                    }}
                    className={`px-4 py-2 rounded-full text-label-md transition-all ${
                      roleView === 'renter'
                        ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    My Rentals (As Renter) ({asRenter.length})
                  </button>
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
            </div>

            {loading ? (
              <div className="h-64 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
            ) : filteredOrders.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center text-on-surface-variant">
                No matching orders found.
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
                      <th className="py-3.5 px-5">Order ID</th>
                      <th className="py-3.5 px-5">Item & City</th>
                      <th className="py-3.5 px-5">
                        {roleView === 'owner' ? 'Renter' : 'Owner'}
                      </th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Rental Period</th>
                      <th className="py-3.5 px-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredOrders.map((booking) => {
                      const peer = roleView === 'owner' ? booking.renter : booking.owner;
                      const meta = STATUS_META[booking.status] || {
                        label: booking.status,
                        badgeClass: 'bg-surface-container text-on-surface'
                      };
                      const isSelected = selectedId === booking._id;
                      return (
                        <tr
                          key={booking._id}
                          onClick={() => setSelectedId(booking._id)}
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
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs"
            onClick={() => setSelectedId('')}
          />
          <aside className="relative z-10 w-full max-w-md bg-surface-container-lowest h-full shadow-[0_20px_32px_-8px_rgba(41,37,36,0.22)] border-l border-surface-container flex flex-col">
            <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div>
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Order Preview
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
                  onClick={() => setSelectedId('')}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {chatError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {chatError}
                </div>
              )}

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
