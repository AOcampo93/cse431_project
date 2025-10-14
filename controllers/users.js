const mongodb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

/*
 * Controller for managing users.
 *
 * This file provides handlers for CRUD operations on the `users` collection.
 * A user can represent an administrator, service provider or client.  It
 * contains basic identifying information such as name, phone and email.  In
 * addition, we persist the authentication provider and ID in `authProvider`
 * and `authId`.  See `swagger.json` for a description of the expected
 * payloads.  All responses conform to the JSON API pattern used elsewhere in
 * this project.
 */

// Return all users
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().db().collection('users').find();
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Return a single user by ID
const getSingle = async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().db().collection('users').find({ _id: userId });
    result.toArray().then((lists) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(lists[0]);
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const user = {
      authProvider: req.body.authProvider,
      authId: req.body.authId || null,
      email: req.body.email,
      password: req.body.password || null,
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role || 'client',
      avatarUrl: req.body.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const response = await mongodb.getDb().db().collection('users').insertOne(user);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res.status(500).json(response.error || 'Some error occurred while creating the user.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update an existing user
const updateUser = async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    // Build the updated user object.  We preserve existing values if they are
    // omitted from the request body.  Note: for a production system you
    // probably want to limit which fields can be updated and handle null/undefined
    // more strictly.
    const updatedUser = {
      authProvider: req.body.authProvider,
      authId: req.body.authId || null,
      email: req.body.email,
      password: req.body.password || null,
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      avatarUrl: req.body.avatarUrl || null,
      updatedAt: new Date()
    };
    const response = await mongodb
      .getDb()
      .db()
      .collection('users')
      .replaceOne({ _id: userId }, updatedUser);
    if (response.modifiedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while updating the user.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const response = await mongodb
      .getDb()
      .db()
      .collection('users')
      .remove({ _id: userId }, true);
    if (response.deletedCount > 0) {
      res.status(204).send();
    } else {
      res.status(500).json(response.error || 'Some error occurred while deleting the user.');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getAll,
  getSingle,
  createUser,
  updateUser,
  deleteUser
};