const router = require('express').Router();
const servicesController = require('../controllers/services');
const validateObjectId = require('../middleware/validateObjectId');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

/*
 * Routes for managing services
 *
 * Base route: /services
 */

// Anyone can read services
router.get('/', servicesController.getAll);
router.get('/:id', validateObjectId, servicesController.getSingle);

// Creating, updating and deleting services is restricted to admins
router.post('/', authenticate, authorize('admin'), servicesController.createService);
router.put('/:id', authenticate, authorize('admin'), validateObjectId, servicesController.updateService);
router.delete('/:id', authenticate, authorize('admin'), validateObjectId, servicesController.deleteService);

module.exports = router;