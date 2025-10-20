/**
 * Global error-handling middleware.
 *
 * This function centralizes error responses for the application. It inspects
 * the incoming error and chooses an appropriate HTTP status code and message.
 * It handles Mongoose validation errors, duplicate key errors, cast errors
 * for invalid ObjectIds, and falls back to 500 for unexpected errors.
 */
module.exports = (err, req, res, next) => {
  console.error('Global error handler:', err);
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: true, message: err.message });
  }
  // Duplicate key error (e.g., unique index violation)
  if (err?.code === 11000) {
    return res.status(409).json({ error: true, message: 'Duplicate key error' });
  }
  // CastError typically indicates invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ error: true, message: 'Invalid ID format' });
  }
  // If error has a defined status, use it
  if (err.status) {
    return res.status(err.status).json({ error: true, message: err.message });
  }
  // Fallback to 500
  return res.status(500).json({ error: true, message: 'Internal Server Error' });
};