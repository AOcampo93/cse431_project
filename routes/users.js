const router = require('express').Router();
const usersController = require('../controllers/users');
const validateObjectId = require('../middleware/validateObjectId');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

/*
 * Routes for managing users
 *
 * Base route: /users
 */

// Only admins can list all users
router.get('/', authenticate, authorize('admin'), usersController.getAll);

// Get a single user by id. Admins can fetch any user; regular users can
// only fetch their own record.
router.get(
  '/:id',
  authenticate,
  validateObjectId,
  (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ error: true, message: 'Forbidden: cannot access other users' });
    }
    return usersController.getSingle(req, res, next);
  }
);

// Only admins can create new users via this endpoint. Normal registration
// should occur through POST /auth/register. This route exists for
// completeness but is protected.
router.post('/', authenticate, authorize('admin'), usersController.createUser);

// Update an existing user. Admins can update any user; regular users
// can only update themselves. Note that role changes are only allowed
// for admins; any attempt by a non‑admin to set `role` will be ignored.
router.put(
  '/:id',
  authenticate,
  validateObjectId,
  async (req, res, next) => {
    // If not admin and not owner, forbid
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ error: true, message: 'Forbidden: cannot update other users' });
    }
    // Prevent non‑admins from changing role, authProvider or authId
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.authProvider;
      delete req.body.authId;
    }
    return usersController.updateUser(req, res, next);
  }
);

// Only admins can delete users
router.delete(
  '/:id',
  authenticate,
  validateObjectId,
  authorize('admin'),
  usersController.deleteUser
);

module.exports = router;