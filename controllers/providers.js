const mongoose = require('mongoose');
const Provider = require('../models/provider');

/**
 * Helpers
 */
const isValidId = (id) => mongoose.isValidObjectId(id);
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * GET /providers
 * Return all providers
 */
const getAll = async (req, res, next) => {
  try {
    const providers = await Provider.find();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(providers);
  } catch (err) {
    console.error('getAll providers error:', err);
    return next(err);
  }
};

/**
 * GET /providers/:id
 * Return a single provider by ID
 */
const getSingle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid provider id' });
    }
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ error: true, message: 'Provider not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(provider);
  } catch (err) {
    console.error('getSingle provider error:', err);
    return next(err);
  }
};

/**
 * POST /providers
 * Create a new provider
 */
const createProvider = async (req, res, next) => {
  try {
    const { name, email, phone, specialties, availability, isActive } = req.body;
    // Ensure required fields are present
    if (!name || !email) {
      return res.status(400).json({
        error: true,
        message: 'name and email are required',
      });
    }
    const provider = new Provider({
      name,
      email,
      phone,
      specialties,
      availability,
      isActive,
    });
    await provider.save();
    return res.status(201).json(provider);
  } catch (err) {
    console.error('createProvider error:', err);
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
 * PUT /providers/:id
 * Update an existing provider (partial update)
 */
const updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid provider id' });
    }
    const updates = sanitize({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      specialties: req.body.specialties,
      availability: req.body.availability,
      isActive: req.body.isActive,
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }
    const updated = await Provider.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Provider not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateProvider error:', err);
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
 * DELETE /providers/:id
 * Delete a provider
 */
const deleteProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid provider id' });
    }
    const deleted = await Provider.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Provider not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('deleteProvider error:', err);
    return next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createProvider,
  updateProvider,
  deleteProvider,
};