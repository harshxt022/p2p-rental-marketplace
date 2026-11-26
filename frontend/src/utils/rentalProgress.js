export const STATUS_META = {
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed'
  },
  APPROVED: {
    label: 'Approved',
    badgeClass: 'bg-secondary-fixed text-on-secondary-fixed'
  },
  LIVE: {
    label: 'In Progress',
    badgeClass: 'bg-primary-container text-on-primary'
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'bg-secondary-container text-on-secondary-container'
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-error-container text-on-error-container'
  }
};

export const calcRentalProgress = (booking) => {
  if (!booking) return 0;
  if (booking.status === 'COMPLETED') return 100;
  if (booking.status !== 'LIVE') return 0;
  const startMs = new Date(booking.startDate).getTime();
  const totalMs = Math.max(1, (booking.days || 1) * 24 * 3600000);
  const effectiveNow = Date.now() + (booking.demoOffsetHours || 0) * 3600000;
  const pct = ((effectiveNow - startMs) / totalMs) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
};

export const getBookingTimeline = (booking) => {
  if (!booking) return [];
  if (Array.isArray(booking.timeline) && booking.timeline.length > 0) {
    return booking.timeline;
  }
  return [
    {
      title: 'Rental Requested',
      description: `Order created for ${booking.days} ${booking.days === 1 ? 'day' : 'days'}.`,
      timestamp: booking.createdAt
    }
  ];
};

export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
