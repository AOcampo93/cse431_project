/**
 * Authorization middleware generator.
 *
 * Use this helper to restrict access based on user roles. Pass one
 * or more allowed roles; if the authenticated user's role is not
 * included in the list the request is aborted with a 403 response.
 *
 * Example:
 *   const authorize = require('./authorize');
 *   router.post('/', authenticate, authorize('admin'), handler);
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: true, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: true, message: 'Forbidden: insufficient privileges' });
    }
    return next();
  };
}

module.exports = authorize;