const mongodb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

/*
 * Controller for managing providers (service providers).
 *
 * Providers represent the individuals or businesses offering services
 * (hairdressers, doctors, mechanics, trainers, etc.).  The optional
 * `availability` field can be used to store scheduling information but
 * is treated as an opaque object in this basic controller.  See
 * `swagger.json` for the expected request payloads.
 */

// Return all providers
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().db().collection('providers').find();
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Return a single provider by ID
const getSingle = async (req, res) => {
  try {
    const providerId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().db().collection('providers').find({ _id: providerId });
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists[0]);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Create a new provider
const createProvider = async (req, res) => {
  try {
    const provider = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      specialties: req.body.specialties || [],
      availability: req.body.availability || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    const response = await mongodb.getDb().db().collection('providers').insertOne(provider);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res.status(500).json(response.error || 'Some error occurred while creating the provider.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update an existing provider
const updateProvider = async (req, res) => {
  try {
    const providerId = new ObjectId(req.params.id);
    const updatedProvider = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      specialties: req.body.specialties || [],
      availability: req.body.availability || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    const response = await mongodb
      .getDb()
      .db()
      .collection('providers')
      .replaceOne({ _id: providerId }, updatedProvider);
    if (response.modifiedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while updating the provider.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete a provider
const deleteProvider = async (req, res) => {
  try {
    const providerId = new ObjectId(req.params.id);
    const response = await mongodb
      .getDb()
      .db()
      .collection('providers')
      .remove({ _id: providerId }, true);
    if (response.deletedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while deleting the provider.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createProvider,
  updateProvider,
  deleteProvider
};