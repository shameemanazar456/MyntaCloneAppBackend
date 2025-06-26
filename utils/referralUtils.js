// utils/referralUtils.js

const users = require('../model/userModel');
const referralRewards = require('../model/referralRewardModel');

const REWARD_AMOUNT = 10; // ₹10 for referrer

/**
 * Handles referral wallet credit and reward tracking after user's first order
 * @param {ObjectId} userId - ID of the user who placed the order
 */
async function handleReferralAfterFirstOrder(userId) {
  const user = await users.findById(userId);

  
  if (!user || user.hasPlacedFirstOrder) return;

  user.hasPlacedFirstOrder = true;

  if (user.referredBy) {
    const referrer = await users.findById(user.referredBy);
    if (referrer) {
      referrer.walletBalance = (referrer.walletBalance || 0) + REWARD_AMOUNT;
      await referrer.save();

      
      await referralRewards.create({
        referrer: referrer._id,
        referredUser: user._id,
        rewardType: 'wallet',
        status: 'issued',
        issuedAt: new Date(),
      });
    }
  }

  await user.save();
}

module.exports = {
  handleReferralAfterFirstOrder
};
