const mongodb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

/*
 * Controller for managing services.
 *
 * Services represent the offerings that a business or provider can schedule.
 * Each service has a name, duration in minutes, price and optional
 * description and category.  The `isActive` flag controls whether a service
 * can be booked.  See `swagger.json` for the expected request payloads.
 */

// Return all services
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().db().collection('services').find();
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Return a single service by ID
const getSingle = async (req, res) => {
  try {
    const serviceId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().db().collection('services').find({ _id: serviceId });
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists[0]);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Create a new service
const createService = async (req, res) => {
  try {
    const service = {
      name: req.body.name,
      durationMin: req.body.durationMin,
      price: req.body.price,
      description: req.body.description || null,
      category: req.body.category || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    const response = await mongodb.getDb().db().collection('services').insertOne(service);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res.status(500).json(response.error || 'Some error occurred while creating the service.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update an existing service
const updateService = async (req, res) => {
  try {
    const serviceId = new ObjectId(req.params.id);
    const updatedService = {
      name: req.body.name,
      durationMin: req.body.durationMin,
      price: req.body.price,
      description: req.body.description || null,
      category: req.body.category || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    const response = await mongodb
      .getDb()
      .db()
      .collection('services')
      .replaceOne({ _id: serviceId }, updatedService);
    if (response.modifiedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while updating the service.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const serviceId = new ObjectId(req.params.id);
    const response = await mongodb
      .getDb()
      .db()
      .collection('services')
      .remove({ _id: serviceId }, true);
    if (response.deletedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while deleting the service.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createService,
  updateService,
  deleteService
};