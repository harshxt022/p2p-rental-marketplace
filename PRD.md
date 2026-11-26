# PRD: RentMate - P2P Rental Marketplace

## Overview
Build a Peer-to-Peer regional rental marketplace ("RentMate") using React (Vite + Tailwind CSS) in `frontend/` and Node.js (Express + MongoDB + Socket.io) in `backend/`.
- Load all secrets (`MONGO_URI`, `RZP_KEY_ID`, `RZP_KEY_SECRET`, `JWT_SECRET`, `PORT`, `CLIENT_URL`) from `backend/.env` via `dotenv`.
- Store uploaded item images locally in `backend/uploads/` via `multer` (auto-creating `backend/uploads/` if missing) and serve statically at `/uploads` (do not use Cloudinary).
- Use `DESIGN.md` and `code.html` strictly as the visual design reference (color palette, Plus Jakarta Sans typography, rounded cards/pills, warm shadows) with `RentMate` branding and `lucide-react` icons. Implement only the pages and features specified in this PRD (omit non-PRD extras such as persisted wishlists, hero date-range filtering, or unbacked promotional badges).
- Shared Categories: `Cameras & Optics`, `Gaming & Consoles`, `Laptops & Tech`, `Camping & Outdoors`, `Power Tools & DIY`, `Sound & AV`, `Fitness & Cycles`, `Other`.
- Shared Cities: `Chandigarh`, `Mohali`, `Panchkula`, `Delhi NCR`, `Ludhiana`, `Bangalore`, `Mumbai`.
- Write clean, minimal, modular code without inline comments.

## Task 1: Backend Scaffold, Auth & Database Models
- Initialize `backend/package.json` and install `express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `multer`, `razorpay`, `socket.io`.
- Connect to MongoDB (`process.env.MONGO_URI`) and configure CORS (`process.env.CLIENT_URL`) plus static `/uploads` serving `backend/uploads/`.
- Create Mongoose models with exact field names:
  - `User`: `name`, `email` (unique), `password` (bcrypt hashed), `phone`, `city`, `isVerified` (default `false`), `ratingSum` (default `0`), `ratingCount` (default `0`).
  - `Item`: `owner` (ref `User`), `title`, `description`, `category`, `city`, `dailyRate`, `securityDeposit`, `images` (`[String]`), `isActive` (default `true`).
  - `Booking`: `item` (ref `Item`), `renter` (ref `User`), `owner` (ref `User`), `startDate`, `endDate`, `days`, `rentAmount`, `securityDeposit`, `totalAmount`, `status` (`PENDING` | `APPROVED` | `LIVE` | `COMPLETED` | `REJECTED`, default `PENDING`), `handoverOtp`, `returnOtp`, `isPaid` (default `false`), `razorpayOrderId`, `razorpayPaymentId`.
  - `Conversation`: `participants` (`[ref User]`), `item` (ref `Item`), `lastMessage`, `updatedAt`.
  - `Message`: `conversation` (ref `Conversation`), `sender` (ref `User`), `text`, `createdAt`.
  - `Review`: `booking` (ref `Booking`), `reviewer` (ref `User`), `reviewee` (ref `User`), `item` (ref `Item`), `itemRating` (1-5), `userRating` (1-5), `comment`.
- Implement JWT auth middleware (`Authorization: Bearer <token>`) and routes:
  - `POST /api/auth/register` (`{ name, email, password, phone, city }` -> `201 { token, user }`, omitting `password`).
  - `POST /api/auth/login` (`{ email, password }` -> `200 { token, user }`).
  - `GET /api/auth/me` (protected -> `200 { user }`).
  - `PUT /api/auth/profile` (protected, `{ name, phone, city, isVerified }` -> `200 { user }`).

## Task 2: Item Listings, Local Multer Upload & Slot Booking Engine
- Implement `/api/items` CRUD routes:
  - `GET /api/items`: supports query params `q` (title/description regex), `category`, `city`, and `owner=me` (authenticated user's items including inactive; public feed returns `isActive: true` only). Populates `owner` (`name city isVerified ratingSum ratingCount`). Returns `{ items }`.
  - `GET /api/items/:id`: returns `{ item, reviews }` (`item` populated with `owner`; `reviews` populated with `reviewer: name`).
  - `POST /api/items` (protected, `multipart/form-data`): `multer` field `images` (max 4 files, `jpg/jpeg/png/webp`, 5MB limit) stored in `backend/uploads/` as `/uploads/<filename>`, plus `{ title, description, category, city, dailyRate, securityDeposit }`. Returns `201 { item }`.
  - `PUT /api/items/:id` (protected, owner-only): updates item fields (and optional uploaded `images`), returns `200 { item }`.
  - `DELETE /api/items/:id` (protected, owner-only): soft-deletes (`isActive: false`), returns `200 { message }`.
- Implement `/api/bookings` endpoints (all totals computed server-side; normalize dates to UTC midnight):
  - `GET /api/bookings/item/:itemId/booked-dates`: returns `{ bookedRanges: [{ startDate, endDate }] }` for bookings in `APPROVED` or `LIVE`.
  - `POST /api/bookings` (protected): body `{ itemId, startDate, endDate }`. Reject if `endDate < startDate`, `startDate < today`, `item.owner === req.user._id`, or any `APPROVED`/`LIVE` booking overlaps (`startDate <= existingEnd && endDate >= existingStart`, HTTP `409`). Calculate inclusive `days = differenceInCalendarDays(end, start) + 1` (same-day = 1 day), `baseRent = days * item.dailyRate`, `rentAmount = days >= 7 ? Math.round(baseRent * 0.9) : baseRent`, `totalAmount = rentAmount + item.securityDeposit`. Create `PENDING` booking and return `201 { booking }`.
  - `GET /api/bookings/my` (protected): returns `{ asRenter, asOwner }` populated with `item`, `renter`, `owner` (sorted newest first, with OTPs role-scoped).
  - `GET /api/bookings/:id` (protected, renter or owner only): returns `{ booking, hasReviewed }` with `handoverOtp` visible only to `renter` when `APPROVED`, and `returnOtp` visible only to `owner` when `LIVE` and `isPaid === true`.
  - `PATCH /api/bookings/:id/approve` (protected, owner-only, `PENDING` only): re-checks overlap against `APPROVED`/`LIVE` (`409` on conflict), generates 4-digit `handoverOtp` and `returnOtp`, sets `status = 'APPROVED'`, returns `200 { booking }`.
  - `PATCH /api/bookings/:id/reject` (protected, owner-only, `PENDING` only): sets `status = 'REJECTED'`, returns `200 { booking }`.

## Task 3: Dual-OTP Active Rental State Machine, Razorpay & Reviews
- `POST /api/bookings/:id/verify-handover` (protected, owner-only, requires `status === 'APPROVED'`): body `{ otp }`. Validates `otp === booking.handoverOtp`, transitions `APPROVED` -> `LIVE`, emits `booking_updated`, returns `200 { booking }`.
- `POST /api/payments/create-order` (protected, renter-only, requires `status === 'LIVE'` and `!isPaid`): body `{ bookingId }`. Creates Razorpay order (`amount: booking.totalAmount * 100`, `currency: 'INR'`, `receipt: String(booking._id)`), saves `razorpayOrderId`, returns `200 { orderId, amount, currency: 'INR', keyId: process.env.RZP_KEY_ID }`.
- `POST /api/payments/verify` (protected, renter-only): body `{ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Verifies HMAC SHA256 (`razorpay_order_id + '|' + razorpay_payment_id` using `RZP_KEY_SECRET`), sets `isPaid = true`, saves `razorpayOrderId` and `razorpayPaymentId`, emits `booking_updated`, returns `200 { booking }`.
- `POST /api/bookings/:id/verify-return` (protected, renter-only, requires `status === 'LIVE'` and `isPaid === true`): body `{ otp }`. Validates `otp === booking.returnOtp`, transitions `LIVE` -> `COMPLETED`, emits `booking_updated`, returns `200 { booking }`.
- `POST /api/reviews` (protected, renter or owner on `COMPLETED` booking): body `{ bookingId, itemRating, userRating, comment }`. Prevents duplicate review by the same `reviewer` for the same `booking`, assigns `reviewee` to the other participant, increments `reviewee.ratingSum += userRating` and `reviewee.ratingCount += 1`, returns `201 { review }`.
- `GET /api/reviews/item/:itemId`: returns `{ reviews }` populated with `reviewer: name`.

## Task 4: Socket.io Real-Time Chat & Live Booking Sync
- Attach `socket.io` to the Express HTTP server with CORS `process.env.CLIENT_URL`.
- Authenticate sockets via `socket.handshake.auth.token` (JWT) and auto-join personal room `user:<userId>`.
- Listen for room events: `join_chat` (`conversationId` -> join `chat:<id>`), `leave_chat`, `join_booking` (`bookingId` -> join `booking:<id>`), `leave_booking`.
- Implement `/api/chats` REST endpoints:
  - `POST /api/chats` (protected): body `{ participantId, itemId }` -> finds existing `Conversation` matching both participants and `item` or creates one; returns `200 { conversation }`.
  - `GET /api/chats` (protected): returns `{ conversations }` populated with `participants` (`name city isVerified`) and `item` (`title images dailyRate`), sorted by `updatedAt` desc.
  - `GET /api/chats/:id/messages` (protected, participant-only): returns `{ messages }` sorted by `createdAt` asc.
  - `POST /api/chats/:id/messages` (protected, participant-only): body `{ text }` -> creates `Message`, updates `Conversation.lastMessage` and `updatedAt`, emits `new_message` (`{ conversationId, message }`) to `chat:<id>` and `user:<recipientId>`, returns `201 { message }`.
- Emit `booking_updated` (`{ bookingId, status, isPaid }`) to `booking:<bookingId>`, `user:<renterId>`, and `user:<ownerId>` whenever approve, reject, handover OTP, Razorpay payment verification, or return OTP succeeds.

## Task 5: Frontend Scaffold, Discovery Home, Post Ad & Account Pages
- Initialize Vite React + Tailwind CSS in `frontend/` and install `axios`, `react-router-dom`, `lucide-react`, `socket.io-client`, `react-day-picker`, `date-fns`.
- Configure `frontend/tailwind.config.js` and `frontend/src/index.css` with the `DESIGN.md` / `code.html` color palette, Plus Jakarta Sans font, and radii/shadow styles.
- Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` to `frontend/index.html`.
- Build `AuthContext`, `SocketContext`, and `api.js` Axios helper (`http://localhost:5000/api` + Bearer token). Prefix `/uploads/...` image URLs with `http://localhost:5000`.
- Build `RentMate` Navbar (Search, City filter, `+ Rent Out` -> `/post-ad`, `Chats` -> `/chats`, `My Ads` -> `/my-ads`, `Account` -> `/account` or Login/Register modal), Home Discovery feed (`/`) with Hero search, Category chips, City chips, and Item grid, Post Ad (`/post-ad` with up to 4 local photo previews), and Account (`/account` with profile editing & Verified Peer toggle).

## Task 6: Item Detail Calendar, Real-Time Chats & Active Rental Window
- Item Detail (`/item/:id`): photo gallery, owner badge & rating, item reviews, `react-day-picker` disabling past dates and `bookedRanges`, auto-cost calculator (`days * dailyRate` with 10% rent discount for `days >= 7` + `securityDeposit`), `Chat with Owner` (`POST /api/chats` -> `/chats`), and `Request to Rent` (`POST /api/bookings` -> `/booking/:id`).
- WebSocket Chats (`/chats`): conversation list sidebar and real-time message pane listening to `new_message`.
- My Ads & Orders (`/my-ads`): tabs for `My Listings` (edit/deactivate), `Incoming Requests` (Approve/Reject + View Order), and `Active & Past Rentals` (View Order).
- Active Rental Window (`/booking/:id`): joins `booking:<id>` and refetches `/api/bookings/:id` on `booking_updated`; displays `handoverOtp` to renter & OTP input to owner when `APPROVED`; unlocks Razorpay Checkout button (`key: keyId` from `/api/payments/create-order`) to renter when `LIVE` & `!isPaid`; displays `returnOtp` to owner & OTP input to renter when `LIVE` & `isPaid`; shows 1-5 star Review modal/form (`itemRating`, `userRating`, `comment`) when `COMPLETED` and `!hasReviewed`.

## Task 7: Database Seed & End-to-End Verification
- Create `backend/seed.js` that generates local sample item images into `backend/uploads/`, seeds 2 demo accounts (`rahul@demo.com` / `123456` and `priya@demo.com` / `123456`), and creates sample regional listings (PS5 Console, Sony DSLR Camera, Camping Tent, plus optional additional category samples).
- Run `npm run build` in `frontend/` and verify backend syntax (`node -c`) and startup with MongoDB (`RentKaro`) to ensure zero errors.