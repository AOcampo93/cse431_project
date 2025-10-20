const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

let connection = null;

/**
 * Initialize the MongoDB connection using Mongoose. This function maintains
 * a singleton connection. It accepts a callback which will be invoked once
 * the connection attempt has completed. On success, the callback receives
 * (null, connection); on failure, it receives the error.
 *
 * @param {Function} callback - function to call when connection is ready
 */
const initDb = async (callback) => {
  if (connection) {
    console.log('Db is already initialized!');
    return callback(null, connection);
  }
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB via Mongoose');
    return callback(null, connection);
  } catch (err) {
    console.error('Mongoose connection error:', err);
    return callback(err);
  }
};

/**
 * Returns the active Mongoose connection. If initDb has not been called
 * previously, this will throw an error. Ensure initDb is called during
 * application start-up.
 *
 * @returns {mongoose.Connection}
 */
const getDb = () => {
  if (!connection) {
    throw new Error('Db not initialized');
  }
  return connection;
};

module.exports = {
  initDb,
  getDb,
};