const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId parameters.
 *
 * This middleware checks the `id` param on the request. If the ID is missing
 * or not a valid ObjectId, it responds with a 400 Bad Request. Otherwise
 * it calls `next()` to continue processing the request.
 */
module.exports = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: true, message: 'Invalid ID' });
  }
  next();
};