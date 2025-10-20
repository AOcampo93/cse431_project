const mongoose = require('mongoose');
const Service = require('../models/service');

/**
 * Helpers
 */
const isValidId = (id) => mongoose.isValidObjectId(id);
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * GET /services
 * Return all services
 */
const getAll = async (req, res, next) => {
  try {
    const services = await Service.find();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(services);
  } catch (err) {
    console.error('getAll services error:', err);
    return next(err);
  }
};

/**
 * GET /services/:id
 * Return a single service by ID
 */
const getSingle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid service id' });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: true, message: 'Service not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(service);
  } catch (err) {
    console.error('getSingle service error:', err);
    return next(err);
  }
};

/**
 * POST /services
 * Create a new service
 */
const createService = async (req, res, next) => {
  try {
    const { name, durationMin, price, description, category, isActive } = req.body;
    const service = new Service({
      name,
      durationMin,
      price,
      description,
      category,
      isActive,
    });
    await service.save();
    return res.status(201).json(service);
  } catch (err) {
    console.error('createService error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
};

/**
 * PUT /services/:id
 * Update an existing service (partial update)
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid service id' });
    }
    const updates = sanitize({
      name: req.body.name,
      durationMin: req.body.durationMin,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      isActive: req.body.isActive,
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }
    const updated = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Service not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    console.error('updateService error:', err);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
};

/**
 * DELETE /services/:id
 * Delete a service
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid service id' });
    }
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Service not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('deleteService error:', err);
    return next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createService,
  updateService,
  deleteService,
};