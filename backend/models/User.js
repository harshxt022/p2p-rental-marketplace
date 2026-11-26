const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '', trim: true },
    city: { type: String, default: 'Chandigarh', trim: true },
    isVerified: { type: Boolean, default: false },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
