const mongoose = require('mongoose');

const godownSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Godown name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Godown address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Godown coordinates are required'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
godownSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Godown', godownSchema);
