const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    dailyRate: { type: Number, required: true, min: 1 },
    securityDeposit: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
