import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  MapPin,
  Star,
  BadgeCheck,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Package
} from 'lucide-react';
import api from '../services/api';
import { getImageUrl, formatRating } from '../constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const toLocalDayFromUtc = (isoValue) => {
  const d = new Date(isoValue);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [range, setRange] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [itemRes, bookedRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/bookings/item/${id}/booked-dates`)
        ]);
        setItem(itemRes.data.item);
        setReviews(itemRes.data.reviews || []);
        setBookedRanges(bookedRes.data.bookedRanges || []);
      } catch {
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const disabledDays = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ranges = bookedRanges.map((r) => ({
      from: toLocalDayFromUtc(r.startDate),
      to: toLocalDayFromUtc(r.endDate)
    }));
    return [{ before: today }, ...ranges];
  }, [bookedRanges]);

  const pricing = useMemo(() => {
    if (!item || !range?.from) return null;
    const end = range.to || range.from;
    const days = differenceInCalendarDays(end, range.from) + 1;
    if (days < 1) return null;
    const baseRent = days * item.dailyRate;
    const discount = days >= 7 ? Math.round(baseRent * 0.1) : 0;
    const rentAmount = baseRent - discount;
    const totalAmount = rentAmount + item.securityDeposit;
    return { days, baseRent, discount, rentAmount, totalAmount, start: range.from, end };
  }, [item, range]);

  const handleChatWithOwner = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    try {
      const { data } = await api.post('/chats', {
        participantId: item.owner._id,
        itemId: item._id
      });
      navigate(`/chats?id=${data.conversation._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start chat');
    }
  };

  const handleRequestRent = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!pricing) {
      setError('Please select rental dates on the calendar');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', {
        itemId: item._id,
        startDate: format(pricing.start, 'yyyy-MM-dd'),
        endDate: format(pricing.end, 'yyyy-MM-dd')
      });
      navigate(`/booking/${data.booking._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking request');
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user && item?.owner?._id === user._id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 max-w-7xl w-full mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        {loading ? (
          <div className="h-96 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
        ) : !item ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container">
            <h1 className="text-headline-md text-on-surface">Listing not found</h1>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container">
                <div className="h-80 sm:h-96 bg-surface-container flex items-center justify-center">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={getImageUrl(item.images[activeImage] || item.images[0])}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-outline" />
                  )}
                </div>
                {item.images && item.images.length > 1 && (
                  <div className="flex gap-3 p-4 overflow-x-auto">
                    {item.images.map((img, idx) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setActiveImage(idx)}
                        className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                          activeImage === idx ? 'border-primary-container' : 'border-transparent'
                        }`}
                      >
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm">
                    {item.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
                    <MapPin className="w-4 h-4 text-primary-container" />
                    {item.city}
                  </span>
                </div>
                <h1 className="text-headline-lg text-on-surface">{item.title}</h1>
                <p className="text-body-lg text-on-surface-variant mt-3 whitespace-pre-line">
                  {item.description}
                </p>

                <div className="mt-6 pt-6 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-headline-sm font-bold">
                      {item.owner?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-headline-sm text-on-surface">{item.owner?.name}</p>
                        {item.owner?.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {formatRating(item.owner)} • {item.owner?.city}
                      </p>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={handleChatWithOwner}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-primary-container" />
                      <span>Chat with Owner</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6">
                <h2 className="text-headline-md text-on-surface mb-4">
                  Renter Reviews ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No reviews yet for this item.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev._id} className="p-4 rounded-xl bg-surface-container-low">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-label-md text-on-surface">
                            {rev.reviewer?.name || 'User'}
                          </span>
                          <span className="flex items-center gap-1 text-label-md text-primary">
                            <Star className="w-3.5 h-3.5 fill-primary" />
                            {rev.itemRating}/5
                          </span>
                        </div>
                        {rev.comment && (
                          <p className="text-body-md text-on-surface-variant">{rev.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-28 bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_12px_24px_-4px_rgba(41,37,36,0.08)] p-6">
                <div className="flex items-baseline justify-between pb-4 border-b border-surface-container">
                  <div>
                    <span className="text-display-mobile text-on-surface">₹{item.dailyRate}</span>
                    <span className="text-body-md text-on-surface-variant"> / day</span>
                  </div>
                  <span className="text-body-sm text-secondary font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Deposit ₹{item.securityDeposit}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-label-md text-on-surface flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary-container" />
                    Select Rental Dates (10% off 7+ days)
                  </p>
                  <div className="flex justify-center p-2 rounded-xl bg-surface-container-low border border-surface-container overflow-x-auto">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      disabled={disabledDays}
                      excludeDisabled
                    />
                  </div>
                </div>

                {pricing && (
                  <div className="mt-5 p-4 rounded-xl bg-surface-container-low space-y-2 text-body-md">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        ₹{item.dailyRate} × {pricing.days} {pricing.days === 1 ? 'day' : 'days'}
                      </span>
                      <span>₹{pricing.baseRent}</span>
                    </div>
                    {pricing.discount > 0 && (
                      <div className="flex justify-between text-secondary font-semibold">
                        <span>7+ Days Weekly Discount (10%)</span>
                        <span>-₹{pricing.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Refundable Security Deposit</span>
                      <span>₹{item.securityDeposit}</span>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex justify-between text-headline-sm text-on-surface font-bold">
                      <span>Total Payable</span>
                      <span>₹{pricing.totalAmount}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                    {error}
                  </div>
                )}

                {isOwner ? (
                  <p className="mt-5 text-center text-body-md text-on-surface-variant p-3 rounded-xl bg-surface-container-low">
                    This is your own listing.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={submitting || !pricing}
                    onClick={handleRequestRent}
                    className="mt-5 w-full h-12 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Sending Request...' : 'Request to Rent'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
