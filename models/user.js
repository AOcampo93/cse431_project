const mongoose = require('mongoose');

// Define the User schema with validation rules.
// The authProvider distinguishes between external providers like Google and
// internal credentials. The email field is unique and must match a basic
// email regex. The role field restricts the allowed user roles and
// defaults to 'client'. Timestamps add createdAt and updatedAt automatically.
const userSchema = new mongoose.Schema(
  {
    authProvider: {
      type: String,
      enum: ['google', 'credentials'],
      required: true,
    },
    authId: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+@.+\..+/, // basic email format validation
    },
    password: { type: String },
    name: {
      type: String,
      required: true,
    },
    phone: { type: String },
    role: {
      type: String,
      enum: ['admin', 'provider', 'client'],
      default: 'client',
    },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);