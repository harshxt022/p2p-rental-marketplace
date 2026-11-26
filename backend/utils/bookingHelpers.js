const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeUtcDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const getTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const calcBookingAmounts = (startDate, endDate, dailyRate, securityDeposit) => {
  const days = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  const baseRent = days * dailyRate;
  const rentAmount = days >= 7 ? Math.round(baseRent * 0.9) : baseRent;
  const totalAmount = rentAmount + securityDeposit;
  return { days, rentAmount, securityDeposit, totalAmount };
};

const generateOtp = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

const extractId = (val) => {
  if (!val) return '';
  return val._id ? val._id.toString() : val.toString();
};

const scopeBookingForUser = (booking, userId) => {
  const obj = booking.toObject ? booking.toObject() : { ...booking };
  const uid = userId.toString();
  const renterId = extractId(obj.renter);
  const ownerId = extractId(obj.owner);

  if (!(renterId === uid && obj.status === 'APPROVED')) {
    delete obj.handoverOtp;
  }
  if (!(ownerId === uid && obj.status === 'LIVE' && obj.isPaid === true)) {
    delete obj.returnOtp;
  }
  return obj;
};

module.exports = {
  normalizeUtcDate,
  getTodayUtc,
  calcBookingAmounts,
  generateOtp,
  scopeBookingForUser
};
