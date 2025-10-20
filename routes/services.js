const router = require('express').Router();
const servicesController = require('../controllers/services');
const validateObjectId = require('../middleware/validateObjectId');

/*
 * Routes for managing services
 *
 * Base route: /services
 */

router.get('/', servicesController.getAll);
router.get('/:id', validateObjectId, servicesController.getSingle);
router.post('/', servicesController.createService);
router.put('/:id', validateObjectId, servicesController.updateService);
router.delete('/:id', validateObjectId, servicesController.deleteService);

module.exports = router;