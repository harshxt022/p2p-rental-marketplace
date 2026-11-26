import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  IndianRupee,
  ShieldCheck,
  Activity,
  Package,
  Star,
  PlusCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { formatRating } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { STATUS_META } from '../utils/rentalProgress';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { user, openAuthModal } = useAuth();
  const socket = useSocket();
  const [asOwner, setAsOwner] = useState([]);
  const [asRenter, setAsRenter] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [bookingsRes, itemsRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/items?owner=me')
      ]);
      setAsOwner(bookingsRes.data.asOwner || []);
      setAsRenter(bookingsRes.data.asRenter || []);
      setMyItems(itemsRes.data.items || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_updated', loadDashboard);
    return () => socket.off('booking_updated', loadDashboard);
  }, [socket, loadDashboard]);

  const metrics = useMemo(() => {
    const earnings = asOwner
      .filter((b) => b.isPaid || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.rentAmount || 0), 0);

    const depositsHeld = [...asOwner, ...asRenter]
      .filter((b) => b.status === 'LIVE' && b.isPaid)
      .reduce((sum, b) => sum + (b.securityDeposit || 0), 0);

    const activeCount = [...asOwner, ...asRenter].filter((b) =>
      ['APPROVED', 'LIVE'].includes(b.status)
    ).length;

    const activeListings = myItems.filter((i) => i.isActive).length;

    return {
      earnings,
      depositsHeld,
      activeCount,
      totalListings: myItems.length,
      activeListings
    };
  }, [asOwner, asRenter, myItems]);

  const actionItems = useMemo(() => {
    const list = [];
    asOwner.forEach((b) => {
      if (b.status === 'PENDING') {
        list.push({
          id: `owner-pending-${b._id}`,
          title: `Approve/Reject request for ${b.item?.title}`,
          subtitle: `From ${b.renter?.name} • ₹${b.totalAmount}`,
          cta: 'Review Request',
          to: `/incoming-orders?bookingId=${b._id}`
        });
      } else if (b.status === 'APPROVED') {
        list.push({
          id: `owner-handover-${b._id}`,
          title: `Enter Handover OTP for ${b.item?.title}`,
          subtitle: `Renter ${b.renter?.name} is ready for pickup`,
          cta: 'Verify Handover',
          to: `/incoming-orders?bookingId=${b._id}`
        });
      } else if (b.status === 'LIVE' && b.isPaid) {
        list.push({
          id: `owner-return-${b._id}`,
          title: `Share Return OTP for ${b.item?.title}`,
          subtitle: `Paid ₹${b.totalAmount} • Awaiting return confirmation`,
          cta: 'View Return OTP',
          to: `/incoming-orders?bookingId=${b._id}`
        });
      }
    });

    asRenter.forEach((b) => {
      if (b.status === 'APPROVED') {
        list.push({
          id: `renter-handover-${b._id}`,
          title: `Share Handover OTP for ${b.item?.title}`,
          subtitle: `Approved by ${b.owner?.name} • Ready for pickup`,
          cta: 'View Handover OTP',
          to: `/my-rentals?bookingId=${b._id}`
        });
      } else if (b.status === 'LIVE' && !b.isPaid) {
        list.push({
          id: `renter-pay-${b._id}`,
          title: `Complete Razorpay Payment for ${b.item?.title}`,
          subtitle: `Total ₹${b.totalAmount} due while rental is LIVE`,
          cta: 'Pay Now',
          to: `/my-rentals?bookingId=${b._id}`
        });
      } else if (b.status === 'LIVE' && b.isPaid) {
        list.push({
          id: `renter-return-${b._id}`,
          title: `Enter Return OTP for ${b.item?.title}`,
          subtitle: `Complete return with ${b.owner?.name} to release deposit`,
          cta: 'Enter Return OTP',
          to: `/my-rentals?bookingId=${b._id}`
        });
      }
    });

    return list;
  }, [asOwner, asRenter]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...asOwner.map((b) => ({ ...b, roleLabel: 'Owner' })),
      ...asRenter.map((b) => ({ ...b, roleLabel: 'Renter' }))
    ];
    return combined
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6);
  }, [asOwner, asRenter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-14 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">Personal Dashboard</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">
              Sign in to view your earnings, deposits, active rentals, and pending actions.
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
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-label-sm uppercase tracking-wider text-primary-container">
                  Welcome back, {user.name}
                </span>
                <h1 className="text-headline-lg text-on-surface mt-0.5">Personal Dashboard</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/post-ad"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ List New Gear</span>
                </Link>
                <Link
                  to="/incoming-orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40"
                >
                  <span>Incoming Orders</span>
                  <ArrowRight className="w-4 h-4 text-primary-container" />
                </Link>
                <Link
                  to="/my-rentals"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40"
                >
                  <span>My Rentals</span>
                  <ArrowRight className="w-4 h-4 text-primary-container" />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-label-sm uppercase tracking-wider">Total Earnings</span>
                    <IndianRupee className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-headline-lg text-on-surface font-extrabold">
                    ₹{metrics.earnings}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    From paid owner rentals
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-label-sm uppercase tracking-wider">Deposits Held</span>
                    <ShieldCheck className="w-4 h-4 text-primary-container" />
                  </div>
                  <p className="text-headline-lg text-on-surface font-extrabold">
                    ₹{metrics.depositsHeld}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">On live paid rentals</p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-label-sm uppercase tracking-wider">Active Rentals</span>
                    <Activity className="w-4 h-4 text-primary-container" />
                  </div>
                  <p className="text-headline-lg text-on-surface font-extrabold">
                    {metrics.activeCount}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">Approved or in progress</p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-label-sm uppercase tracking-wider">Listed Gear</span>
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-headline-lg text-on-surface font-extrabold">
                    {metrics.totalListings}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {metrics.activeListings} active now
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="text-label-sm uppercase tracking-wider">Trust Rating</span>
                    <Star className="w-4 h-4 text-primary fill-primary" />
                  </div>
                  <p className="text-headline-lg text-on-surface font-extrabold">
                    {formatRating(user)}
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {user.isVerified ? 'Verified Peer' : 'Standard Peer'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-6 bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-headline-md text-on-surface flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary-container" />
                    Action Required ({actionItems.length})
                  </h2>
                </div>

                {actionItems.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant py-6 text-center bg-surface-container-low rounded-xl">
                    All caught up! No pending approvals, OTPs, or payments waiting on you.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map((act) => (
                      <div
                        key={act.id}
                        className="p-4 rounded-xl bg-primary-fixed/20 border border-primary-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-label-md text-on-surface truncate">{act.title}</p>
                          <p className="text-body-sm text-on-surface-variant">{act.subtitle}</p>
                        </div>
                        <Link
                          to={act.to}
                          className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-primary-container text-on-primary text-label-sm shrink-0 shadow-sm hover:brightness-95"
                        >
                          <span>{act.cta}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="lg:col-span-6 bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                <h2 className="text-headline-md text-on-surface mb-4">Recent Rental Activity</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant py-6 text-center bg-surface-container-low rounded-xl">
                    No rental activity yet.
                  </p>
                ) : (
                  <div className="divide-y divide-surface-container">
                    {recentActivity.map((b) => {
                      const meta = STATUS_META[b.status] || {
                        label: b.status,
                        badgeClass: 'bg-surface-container text-on-surface'
                      };
                      return (
                        <Link
                          key={`${b.roleLabel}-${b._id}`}
                          to={`/booking/${b._id}`}
                          className="py-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-low px-2 rounded-xl transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                                {b.roleLabel}
                              </span>
                              <span
                                className={`text-label-sm px-2 py-0.5 rounded-full ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-label-md text-on-surface truncate mt-1">
                              {b.item?.title || 'Item'}
                            </p>
                            <p className="text-body-sm text-on-surface-variant">
                              {format(new Date(b.startDate), 'dd MMM')} →{' '}
                              {format(new Date(b.endDate), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-price-md text-on-surface">₹{b.totalAmount}</p>
                            <p className="text-body-sm text-primary">View →</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
