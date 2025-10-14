// controllers/users.js
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');

/**
 * Helpers
 */
const isValidId = (id) => ObjectId.isValid(id);
const sanitize = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * GET /users
 * Return all users
 */
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().db().collection('users').find();
    const users = await result.toArray();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(users);
  } catch (err) {
    console.error('getAll users error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

/**
 * GET /users/:id
 * Return a single user by ID
 */
const getSingle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }

    const user = await mongodb
      .getDb()
      .db()
      .collection('users')
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(user);
  } catch (err) {
    console.error('getSingle user error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

/**
 * POST /users
 * Create a new user
 */
const createUser = async (req, res) => {
  try {
    const now = new Date();
    const user = {
      authProvider: req.body.authProvider, // "google" | "credentials"
      authId: req.body.authId || null,
      email: req.body.email,
      password: req.body.password || null, // (sin hash en esta versión)
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role || 'client', // "admin" | "provider" | "client"
      avatarUrl: req.body.avatarUrl || null,
      createdAt: now,
      updatedAt: now
    };

    const response = await mongodb.getDb().db().collection('users').insertOne(user);
    if (response.acknowledged) {
      // Devolver el documento recién creado
      const created = await mongodb
        .getDb()
        .db()
        .collection('users')
        .findOne({ _id: response.insertedId });
      return res.status(201).json(created);
    }
    return res
      .status(500)
      .json({ error: true, message: 'Some error occurred while creating the user.' });
  } catch (err) {
    console.error('createUser error:', err);
    // Manejo de duplicados (por ejemplo índice único en email)
    if (err?.code === 11000) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

/**
 * PUT /users/:id
 * Update an existing user (partial update using $set)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }

    // Solo aplicamos campos presentes en el body
    const updates = sanitize({
      authProvider: req.body.authProvider, // "google" | "credentials"
      authId: req.body.authId,
      email: req.body.email,
      password: req.body.password, // (sin hash en esta versión)
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      avatarUrl: req.body.avatarUrl
    });

    // Si no hay nada que actualizar
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No fields to update' });
    }

    const result = await mongodb
      .getDb()
      .db()
      .collection('users')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updates, $currentDate: { updatedAt: true } },
        { upsert: false }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // Devuelve el documento actualizado
    const user = await mongodb.getDb().db().collection('users').findOne({ _id: new ObjectId(id) });
    return res.status(200).json(user);
  } catch (err) {
    console.error('updateUser error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: true, message: 'Email already in use' });
    }
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

/**
 * DELETE /users/:id
 * Delete a user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: true, message: 'Invalid user id' });
    }

    const response = await mongodb
      .getDb()
      .db()
      .collection('users')
      .deleteOne({ _id: new ObjectId(id) });

    if (response.deletedCount > 0) {
      return res.status(204).send();
    }
    return res.status(404).json({ error: true, message: 'User not found' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createUser,
  updateUser,
  deleteUser
};