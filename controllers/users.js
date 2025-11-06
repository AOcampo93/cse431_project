// controllers/users.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

/**
 * Helpers
 */
const isValidId = (id) => mongoose.isValidObjectId(id);
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * GET /users
 * Return all users
 */
const getAll = async (req, res, next) => {
  try {
    const users = await User.find();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(users);
  } catch (err) {
    console.error('getAll users error:', err);
    return next(err);
  }
};

/**
 * GET /users/:id
 * Return a single user by ID
 */
const getSingle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(user);
  } catch (err) {
    console.error('getSingle user error:', err);
    return next(err);
  }
};

/**
 * POST /users
 * Create a new user
 */
const createUser = async (req, res, next) => {
  try {
    const {
      authProvider,
      authId,
      email,
      password,
      name,
      phone,
      role,
      avatarUrl,
    } = req.body;
    // Basic validation: ensure required fields are provided
    if (!authProvider || !email || !name) {
      return res.status(400).json({
        error: true,
        message: 'authProvider, email and name are required',
      });
    }
    // Check if a user already exists with this email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    // Prepare new user object; hash password if provided
    const newUser = new User({
      authProvider,
      authId,
      email,
      name,
      phone,
      role,
      avatarUrl,
    });
    if (password) {
      const saltRounds = 10;
      newUser.password = await bcrypt.hash(password, saltRounds);
    }
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (err) {
    console.error('createUser error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
};

/**
 * PUT /users/:id
 * Update an existing user (partial update)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }
    // Only apply fields present in the body
    const updates = sanitize({
      authProvider: req.body.authProvider,
      authId: req.body.authId,
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      avatarUrl: req.body.avatarUrl,
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }
    const updated = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateUser error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
};

/**
 * DELETE /users/:id
 * Delete a user
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('deleteUser error:', err);
    return next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createUser,
  updateUser,
  deleteUser,
};