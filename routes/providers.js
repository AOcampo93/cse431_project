const router = require('express').Router();
const providersController = require('../controllers/providers');
const validateObjectId = require('../middleware/validateObjectId');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

/*
 * Routes for managing providers
 *
 * Base route: /providers
 */

// Anyone can read providers
router.get('/', providersController.getAll);
router.get('/:id', validateObjectId, providersController.getSingle);

// Only admins may create, update or delete providers
router.post('/', authenticate, authorize('admin'), providersController.createProvider);
router.put('/:id', authenticate, authorize('admin'), validateObjectId, providersController.updateProvider);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId, providersController.deleteProvider);

module.exports = router;