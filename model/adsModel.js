const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },  // URL or local path
  link: { type: String },                    // optional: URL to product or external site
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }                  // optional: for timed ads
});

module.exports = mongoose.model('ads', adSchema);
