const mongoose = require('mongoose');

// Schema for providers. Providers represent individuals or organizations
// offering services. The specialties field is an array of strings, and
// availability can store arbitrary scheduling information (opaque here).
const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: /.+@.+\..+/, // basic email format validation
      unique: true,
    },
    phone: { type: String },
    specialties: {
      type: [String],
      default: [],
    },
    availability: {
      type: mongoose.Schema.Types.Mixed,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Provider', providerSchema);