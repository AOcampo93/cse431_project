// controllers/appointments.js
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Service = require('../models/service');

/**
 * Helpers
 */
const isValidId = (id) => mongoose.isValidObjectId(id);
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * GET /appointments
 * Return all appointments
 */
const getAll = async (req, res, next) => {
  try {
    const appointments = await Appointment.find();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(appointments);
  } catch (err) {
    console.error('appointments.getAll error:', err);
    return next(err);
  }
};

/**
 * GET /appointments/:id
 * Return a single appointment by ID
 */
const getSingle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid appointment id' });
    }
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: true, message: 'Appointment not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(appointment);
  } catch (err) {
    console.error('appointments.getSingle error:', err);
    return next(err);
  }
};

/**
 * POST /appointments
 * Create a new appointment
 */
const createAppointment = async (req, res, next) => {
  try {
    let {
      clientId,
      providerId,
      serviceId,
      startAt,
      endAt,
      status,
      notes,
      createdBy,
    } = req.body;
    // Validate required fields
    if (!clientId || !providerId || !serviceId || !startAt) {
      return res.status(400).json({ error: true, message: 'clientId, providerId, serviceId and startAt are required' });
    }
    if (!isValidId(clientId)) {
      return res.status(400).json({ error: true, message: 'clientId must be a valid ObjectId' });
    }
    if (!isValidId(providerId)) {
      return res.status(400).json({ error: true, message: 'providerId must be a valid ObjectId' });
    }
    if (!isValidId(serviceId)) {
      return res.status(400).json({ error: true, message: 'serviceId must be a valid ObjectId' });
    }
    if (createdBy && !isValidId(createdBy)) {
      return res.status(400).json({ error: true, message: 'createdBy must be a valid ObjectId' });
    }
    // Convert to ObjectIds
    const clientObj = new mongoose.Types.ObjectId(clientId);
    const providerObj = new mongoose.Types.ObjectId(providerId);
    const serviceObj = new mongoose.Types.ObjectId(serviceId);
    const createdByObj = createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined;
    // Convert dates
    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: true, message: 'startAt must be a valid ISO date' });
    }
    let endDate = null;
    if (endAt) {
      const endD = new Date(endAt);
      if (isNaN(endD.getTime())) {
        return res.status(400).json({ error: true, message: 'endAt must be a valid ISO date' });
      }
      endDate = endD;
    }
    // Validate status
    const allowedStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: true, message: 'status must be one of: scheduled, confirmed, completed, cancelled' });
    }
    // Compute endAt if missing
    if (!endDate) {
      const service = await Service.findById(serviceObj);
      if (service && service.durationMin) {
        endDate = new Date(startDate.getTime() + Number(service.durationMin) * 60000);
      } else {
        return res.status(400).json({ error: true, message: 'endAt is required when service has no durationMin' });
      }
    }
    const appointment = new Appointment({
      clientId: clientObj,
      providerId: providerObj,
      serviceId: serviceObj,
      startAt: startDate,
      endAt: endDate,
      status,
      notes,
      createdBy: createdByObj,
    });
    await appointment.save();
    return res.status(201).json(appointment);
  } catch (err) {
    console.error('appointments.create error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: true, message: 'Invalid ObjectId provided' });
    }
    return next(err);
  }
};

/**
 * PUT /appointments/:id
 * Update an existing appointment (partial update)
 */
const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid appointment id' });
    }
    const existing = await Appointment.findById(id);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Appointment not found' });
    }
    const updates = {};
    if (req.body.clientId !== undefined) {
      if (!isValidId(req.body.clientId)) {
        return res.status(400).json({ error: true, message: 'clientId must be a valid ObjectId' });
      }
      updates.clientId = new mongoose.Types.ObjectId(req.body.clientId);
    }
    if (req.body.providerId !== undefined) {
      if (!isValidId(req.body.providerId)) {
        return res.status(400).json({ error: true, message: 'providerId must be a valid ObjectId' });
      }
      updates.providerId = new mongoose.Types.ObjectId(req.body.providerId);
    }
    if (req.body.serviceId !== undefined) {
      if (!isValidId(req.body.serviceId)) {
        return res.status(400).json({ error: true, message: 'serviceId must be a valid ObjectId' });
      }
      updates.serviceId = new mongoose.Types.ObjectId(req.body.serviceId);
    }
    if (req.body.startAt !== undefined) {
      const start = new Date(req.body.startAt);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: true, message: 'startAt must be a valid ISO date' });
      }
      updates.startAt = start;
    }
    if (req.body.endAt !== undefined) {
      const end = new Date(req.body.endAt);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: true, message: 'endAt must be a valid ISO date' });
      }
      updates.endAt = end;
    }
    if (req.body.status !== undefined) {
      const allowedStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: true, message: 'status must be one of: scheduled, confirmed, completed, cancelled' });
      }
      updates.status = req.body.status;
    }
    if (req.body.notes !== undefined) {
      updates.notes = req.body.notes;
    }
    if (req.body.createdBy !== undefined) {
      if (req.body.createdBy && !isValidId(req.body.createdBy)) {
        return res.status(400).json({ error: true, message: 'createdBy must be a valid ObjectId' });
      }
      updates.createdBy = req.body.createdBy ? new mongoose.Types.ObjectId(req.body.createdBy) : undefined;
    }
    // Compute endAt if not provided but start/service changed
    const nextStart = updates.startAt !== undefined ? updates.startAt : existing.startAt;
    const nextServiceId = updates.serviceId !== undefined ? updates.serviceId : existing.serviceId;
    if (updates.endAt === undefined && nextStart && nextServiceId) {
      const service = await Service.findById(nextServiceId);
      if (service && service.durationMin) {
        updates.endAt = new Date(nextStart.getTime() + Number(service.durationMin) * 60000);
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }
    const updated = await Appointment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Appointment not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    console.error('appointments.update error:', err);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: true, message: err.message });
    }
    return next(err);
  }
};

/**
 * DELETE /appointments/:id
 * Delete an appointment
 */
const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid appointment id' });
    }
    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: true, message: 'Appointment not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('appointments.delete error:', err);
    return next(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};