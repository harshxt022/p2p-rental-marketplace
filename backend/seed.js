const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Item = require('./models/Item');
const Booking = require('./models/Booking');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Review = require('./models/Review');

dotenv.config({ path: path.join(__dirname, '.env') });

const uploadsDir = path.join(__dirname, 'uploads');

const writeSvgAsset = (filename, title, subtitle, accent) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff8f5"/>
      <stop offset="100%" stop-color="#f6ece6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="660" cy="120" r="140" fill="${accent}" opacity="0.14"/>
  <circle cx="140" cy="490" r="160" fill="#006d30" opacity="0.08"/>
  <rect x="64" y="64" width="672" height="472" rx="32" fill="#ffffff" stroke="#e0c0b1" stroke-width="2"/>
  <rect x="108" y="112" width="140" height="36" rx="18" fill="${accent}"/>
  <text x="178" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff">RentMate</text>
  <text x="108" y="290" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="#1f1b17">${title}</text>
  <text x="108" y="342" font-family="Arial, sans-serif" font-size="22" font-weight="500" fill="#584237">${subtitle}</text>
  <rect x="108" y="420" width="220" height="48" rx="24" fill="#ffdbca"/>
  <text x="218" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#9d4300">Verified Local Gear</text>
</svg>`;
  fs.writeFileSync(path.join(uploadsDir, filename), svg, 'utf8');
  return `/uploads/${filename}`;
};

const seed = async () => {
  await connectDB();

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await Promise.all([
    Review.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
    Booking.deleteMany({}),
    Item.deleteMany({}),
    User.deleteMany({})
  ]);

  const hashedPassword = await bcrypt.hash('123456', 10);

  const [rahul, priya] = await User.create([
    {
      name: 'Rahul Sharma',
      email: 'rahul@demo.com',
      password: hashedPassword,
      phone: '9876543210',
      city: 'Chandigarh',
      isVerified: true,
      ratingSum: 24,
      ratingCount: 5
    },
    {
      name: 'Priya Nair',
      email: 'priya@demo.com',
      password: hashedPassword,
      phone: '9876501234',
      city: 'Mohali',
      isVerified: true,
      ratingSum: 19,
      ratingCount: 4
    }
  ]);

  const ps5Img = writeSvgAsset('seed-ps5.svg', 'PlayStation 5 Console', '2 DualSense Controllers + FIFA 24', '#f97316');
  const dslrImg = writeSvgAsset('seed-dslr.svg', 'Sony Alpha DSLR Kit', '28-70mm Lens + 64GB Card + Bag', '#9d4300');
  const tentImg = writeSvgAsset('seed-tent.svg', 'Quechua Camping Tent', '4-Person Waterproof + Sleeping Mats', '#006d30');
  const macImg = writeSvgAsset('seed-macbook.svg', 'MacBook Air M2', '16GB RAM / 512GB SSD Creator Rig', '#f97316');
  const drillImg = writeSvgAsset('seed-drill.svg', 'Bosch 18V Drill Kit', 'Twin Batteries + 40-pc Bit Case', '#9d4300');
  const audioImg = writeSvgAsset('seed-headphones.svg', 'Sony WH-1000XM5', 'Noise Cancelling + Travel Case', '#006d30');

  await Item.create([
    {
      owner: priya._id,
      title: 'PlayStation 5 + 2 Controllers',
      description: 'PS5 Disc Edition with two DualSense wireless controllers, HDMI 2.1 cable, FIFA 24 and God of War Ragnarok.',
      category: 'Gaming & Consoles',
      city: 'Mohali',
      dailyRate: 500,
      securityDeposit: 3000,
      images: [ps5Img]
    },
    {
      owner: rahul._id,
      title: 'Sony Alpha DSLR Camera Kit',
      description: 'Full-frame Sony DSLR camera with 28-70mm zoom lens, two batteries, 64GB SD card, and padded carry bag.',
      category: 'Cameras & Optics',
      city: 'Chandigarh',
      dailyRate: 1200,
      securityDeposit: 5000,
      images: [dslrImg]
    },
    {
      owner: rahul._id,
      title: 'Quechua 4-Person Camping Tent',
      description: 'Waterproof dome camping tent with rainfly, ground tarp, and 2 sleeping mats. Ideal for weekend treks.',
      category: 'Camping & Outdoors',
      city: 'Panchkula',
      dailyRate: 350,
      securityDeposit: 1000,
      images: [tentImg]
    },
    {
      owner: priya._id,
      title: 'MacBook Air M2 16GB / 512GB',
      description: 'Mint condition MacBook Air M2 with charger and USB-C hub for editing, travel, or client presentations.',
      category: 'Laptops & Tech',
      city: 'Delhi NCR',
      dailyRate: 900,
      securityDeposit: 6000,
      images: [macImg]
    },
    {
      owner: rahul._id,
      title: 'Bosch 18V Cordless Drill & Bit Set',
      description: 'Heavy-duty cordless drill driver with dual lithium batteries, fast charger, and 40-piece bit kit.',
      category: 'Power Tools & DIY',
      city: 'Ludhiana',
      dailyRate: 250,
      securityDeposit: 800,
      images: [drillImg]
    },
    {
      owner: priya._id,
      title: 'Sony WH-1000XM5 ANC Headphones',
      description: 'Active noise cancelling wireless headphones with 30-hour battery life, hard case, and flight adapter.',
      category: 'Sound & AV',
      city: 'Chandigarh',
      dailyRate: 200,
      securityDeposit: 1200,
      images: [audioImg]
    }
  ]);

  console.log('Seed completed: 2 demo users and 6 items created.');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
