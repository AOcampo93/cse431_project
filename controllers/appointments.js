// controllers/appointments.js
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');

/* -------------------------------- Helpers -------------------------------- */

const isValidId = (id) => ObjectId.isValid(id);
const toObjectIdOrNull = (val, fieldName, required = false) => {
  if (val === undefined || val === null) {
    if (required) throw badRequest(`${fieldName} is required`);
    return null;
  }
  if (!isValidId(val)) throw badRequest(`${fieldName} must be a valid ObjectId`);
  return new ObjectId(val);
};

const toDateOrThrow = (val, fieldName, required = false) => {
  if (val === undefined || val === null) {
    if (required) throw badRequest(`${fieldName} is required`);
    return null;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) throw badRequest(`${fieldName} must be a valid ISO date`);
  return d;
};

const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const notFound = (message) => {
  const err = new Error(message);
  err.status = 404;
  return err;
};

const STATUSES = new Set(['scheduled', 'confirmed', 'completed', 'cancelled']);

/* ------------------------------ DB Shortcuts ------------------------------ */

const colAppointments = () => mongodb.getDb().db().collection('appointments');
const colServices = () => mongodb.getDb().db().collection('services');

/* ------------------------------- Controllers ------------------------------ */

// GET /appointments
const getAll = async (req, res) => {
  try {
    const cursor = await colAppointments().find();
    const data = await cursor.toArray();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (err) {
    console.error('appointments.getAll error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

// GET /appointments/:id
const getSingle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw badRequest('Invalid appointment id');

    const doc = await colAppointments().findOne({ _id: new ObjectId(id) });
    if (!doc) throw notFound('Appointment not found');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(doc);
  } catch (err) {
    console.error('appointments.getSingle error:', err);
    const code = err.status || 500;
    return res.status(code).json({ error: true, message: err.message || 'Internal Server Error' });
  }
};

// POST /appointments
const createAppointment = async (req, res) => {
  try {
    // Required fields
    const clientId = toObjectIdOrNull(req.body.clientId, 'clientId', true);
    const providerId = toObjectIdOrNull(req.body.providerId, 'providerId', true);
    const serviceId = toObjectIdOrNull(req.body.serviceId, 'serviceId', true);
    const startAt = toDateOrThrow(req.body.startAt, 'startAt', true);

    // Optional / derived
    let endAt = req.body.endAt ? toDateOrThrow(req.body.endAt, 'endAt') : null;

    // Status
    const status = req.body.status || 'scheduled';
    if (!STATUSES.has(status)) throw badRequest('status must be one of: scheduled, confirmed, completed, cancelled');

    // Compute endAt from service if missing
    if (!endAt) {
      const service = await colServices().findOne({ _id: serviceId });
      if (service?.durationMin) {
        endAt = new Date(startAt.getTime() + Number(service.durationMin) * 60000);
      } else {
        throw badRequest('endAt is required when service has no durationMin');
      }
    }

    const now = new Date();
    const appointment = {
      clientId,
      providerId,
      serviceId,
      startAt,
      endAt,
      status,
      notes: req.body.notes || null,
      createdBy: toObjectIdOrNull(req.body.createdBy, 'createdBy', false),
      createdAt: now,
      updatedAt: now
    };

    const response = await colAppointments().insertOne(appointment);
    if (!response.acknowledged) {
      return res
        .status(500)
        .json({ error: true, message: 'Some error occurred while creating the appointment.' });
    }

    const created = await colAppointments().findOne({ _id: response.insertedId });
    return res.status(201).json(created);
  } catch (err) {
    console.error('appointments.create error:', err);
    const code = err.status || 500;
    return res.status(code).json({ error: true, message: err.message || 'Internal Server Error' });
  }
};

// PUT /appointments/:id (partial update)
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw badRequest('Invalid appointment id');

    const existing = await colAppointments().findOne({ _id: new ObjectId(id) });
    if (!existing) throw notFound('Appointment not found');

    // Build partial updates (convert types if present)
    const updates = sanitize({
      clientId:
        req.body.clientId !== undefined
          ? toObjectIdOrNull(req.body.clientId, 'clientId', true)
          : undefined,
      providerId:
        req.body.providerId !== undefined
          ? toObjectIdOrNull(req.body.providerId, 'providerId', true)
          : undefined,
      serviceId:
        req.body.serviceId !== undefined
          ? toObjectIdOrNull(req.body.serviceId, 'serviceId', true)
          : undefined,
      startAt: req.body.startAt !== undefined ? toDateOrThrow(req.body.startAt, 'startAt', true) : undefined,
      endAt: req.body.endAt !== undefined ? toDateOrThrow(req.body.endAt, 'endAt') : undefined,
      status: req.body.status,
      notes: req.body.notes,
      createdBy:
        req.body.createdBy !== undefined
          ? toObjectIdOrNull(req.body.createdBy, 'createdBy', false)
          : undefined
    });

    // Validate status if provided
    if (updates.status && !STATUSES.has(updates.status)) {
      throw badRequest('status must be one of: scheduled, confirmed, completed, cancelled');
    }

    // Compute endAt if not provided and we have start/service info
    const nextStartAt = updates.startAt !== undefined ? updates.startAt : existing.startAt;
    const nextServiceId = updates.serviceId !== undefined ? updates.serviceId : existing.serviceId;

    if (updates.endAt === undefined && nextStartAt && nextServiceId) {
      const service = await colServices().findOne({ _id: nextServiceId });
      if (service?.durationMin) {
        updates.endAt = new Date(nextStartAt.getTime() + Number(service.durationMin) * 60000);
      }
    }

    const result = await colAppointments().updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates }, $currentDate: { updatedAt: true } },
      { upsert: false }
    );

    if (result.matchedCount === 0) throw notFound('Appointment not found');

    const updated = await colAppointments().findOne({ _id: new ObjectId(id) });
    return res.status(200).json(updated);
  } catch (err) {
    console.error('appointments.update error:', err);
    const code = err.status || 500;
    return res.status(code).json({ error: true, message: err.message || 'Internal Server Error' });
  }
};

// DELETE /appointments/:id
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw badRequest('Invalid appointment id');

    const response = await colAppointments().deleteOne({ _id: new ObjectId(id) });
    if (response.deletedCount > 0) {
      return res.status(204).send();
    }
    throw notFound('Appointment not found');
  } catch (err) {
    console.error('appointments.delete error:', err);
    const code = err.status || 500;
    return res.status(code).json({ error: true, message: err.message || 'Internal Server Error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
