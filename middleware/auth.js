const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication middleware.
 *
 * Expects a JWT Bearer token in the Authorization header. The token
 * payload should contain the user ID and role. The secret used to
 * verify the token is read from the `JWT_SECRET` environment variable
 * (you should set this in your `.env` file or hosting provider). If
 * verification succeeds, a minimal user object containing the id and
 * role is attached to `req.user`. Otherwise a 401 response is
 * returned.
 *
 * Note: When running locally without configuring JWT_SECRET, a
 * fallback secret is used. In production you **must** set a strong
 * secret via the environment.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: true, message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'change_this_secret_in_env';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('role');
    if (!user) {
      return res
        .status(401)
        .json({ error: true, message: 'Invalid authentication token' });
    }
    // attach minimal user context for downstream authorization
    req.user = { id: decoded.id, role: user.role };
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: true, message: 'Invalid or expired authentication token' });
  }
}

module.exports = authenticate;