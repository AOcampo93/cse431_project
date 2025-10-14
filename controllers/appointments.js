const mongodb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

/*
 * Controller for managing appointments (bookings).
 *
 * Appointments link a client, a provider and a service at a specific time.
 * Optionally, the controller will calculate the end time automatically
 * if the service ID is provided and `endAt` is not.  Status may be
 * scheduled, confirmed, completed or cancelled.  Basic error handling
 * is provided; production deployments should implement stricter
 * validation and conflict detection.
 */

// Return all appointments
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().db().collection('appointments').find();
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Return a single appointment by ID
const getSingle = async (req, res) => {
  try {
    const appointmentId = new ObjectId(req.params.id);
    const result = await mongodb
      .getDb()
      .db()
      .collection('appointments')
      .find({ _id: appointmentId });
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists[0]);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Create a new appointment
const createAppointment = async (req, res) => {
  try {
    const startAt = req.body.startAt ? new Date(req.body.startAt) : null;
    let endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    // If endAt not provided but we have a serviceId, compute based on durationMin
    if (!endAt && req.body.serviceId) {
      const serviceId = new ObjectId(req.body.serviceId);
      const service = await mongodb
        .getDb()
        .db()
        .collection('services')
        .findOne({ _id: serviceId });
      if (service && startAt && service.durationMin) {
        endAt = new Date(startAt.getTime() + service.durationMin * 60000);
      }
    }
    const appointment = {
      clientId: req.body.clientId ? new ObjectId(req.body.clientId) : null,
      providerId: req.body.providerId ? new ObjectId(req.body.providerId) : null,
      serviceId: req.body.serviceId ? new ObjectId(req.body.serviceId) : null,
      startAt: startAt,
      endAt: endAt,
      status: req.body.status || 'scheduled',
      notes: req.body.notes || null,
      createdBy: req.body.createdBy ? new ObjectId(req.body.createdBy) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const response = await mongodb
      .getDb()
      .db()
      .collection('appointments')
      .insertOne(appointment);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res
        .status(500)
        .json(response.error || 'Some error occurred while creating the appointment.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update an existing appointment
const updateAppointment = async (req, res) => {
  try {
    const appointmentId = new ObjectId(req.params.id);
    const startAt = req.body.startAt ? new Date(req.body.startAt) : null;
    let endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    if (!endAt && req.body.serviceId) {
      const serviceId = new ObjectId(req.body.serviceId);
      const service = await mongodb
        .getDb()
        .db()
        .collection('services')
        .findOne({ _id: serviceId });
      if (service && startAt && service.durationMin) {
        endAt = new Date(startAt.getTime() + service.durationMin * 60000);
      }
    }
    const updatedAppointment = {
      clientId: req.body.clientId ? new ObjectId(req.body.clientId) : null,
      providerId: req.body.providerId ? new ObjectId(req.body.providerId) : null,
      serviceId: req.body.serviceId ? new ObjectId(req.body.serviceId) : null,
      startAt: startAt,
      endAt: endAt,
      status: req.body.status || 'scheduled',
      notes: req.body.notes || null,
      createdBy: req.body.createdBy ? new ObjectId(req.body.createdBy) : null,
      updatedAt: new Date()
    };
    const response = await mongodb
      .getDb()
      .db()
      .collection('appointments')
      .replaceOne({ _id: appointmentId }, updatedAppointment);
    if (response.modifiedCount > 0) {
      res.status(204).send();
    } else {
      res
        .status(500)
        .json(response.error || 'Some error occurred while updating the appointment.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete an appointment
const deleteAppointment = async (req, res) => {
  try {
    const appointmentId = new ObjectId(req.params.id);
    const response = await mongodb
      .getDb()
      .db()
      .collection('appointments')
      .remove({ _id: appointmentId }, true);
    if (response.deletedCount > 0) {
      res.status(204).send();
    } else {
      res
        .status(500)
        .json(response.error || 'Some error occurred while deleting the appointment.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createAppointment,
  updateAppointment,
  deleteAppointment
};