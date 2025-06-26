const mongoose = require('mongoose');

const referralRewardSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  rewardType: { type: String, default: 'discount' }, // e.g., discount, points, etc.
  status: { type: String, enum: ['pending', 'issued'], default: 'pending' },
  issuedAt: { type: Date },
});

module.exports = mongoose.model('referralRewards', referralRewardSchema);
