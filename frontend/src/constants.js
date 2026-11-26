export const API_BASE_URL = 'http://localhost:5000/api';
export const ASSET_BASE_URL = 'http://localhost:5000';

export const CATEGORIES = [
  'Cameras & Optics',
  'Gaming & Consoles',
  'Laptops & Tech',
  'Camping & Outdoors',
  'Power Tools & DIY',
  'Sound & AV',
  'Fitness & Cycles',
  'Other'
];

export const CITIES = [
  'Chandigarh',
  'Mohali',
  'Panchkula',
  'Delhi NCR',
  'Ludhiana',
  'Bangalore',
  'Mumbai'
];

export const getImageUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }
  return `${ASSET_BASE_URL}${src}`;
};

export const formatRating = (user) => {
  if (!user || !user.ratingCount) return 'New';
  return `${(user.ratingSum / user.ratingCount).toFixed(1)} (${user.ratingCount})`;
};
