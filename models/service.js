const mongoose = require('mongoose');

// Schema for services. Each service has a name, duration in minutes,
// price, an optional description and category, and an active flag. The
// timestamps option automatically adds createdAt and updatedAt fields.
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    durationMin: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: { type: String },
    category: { type: String },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);