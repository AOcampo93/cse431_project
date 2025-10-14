const router = require('express').Router();
const servicesController = require('../controllers/services');

/*
 * Routes for managing services
 *
 * Base route: /services
 */

router.get('/', servicesController.getAll);
router.get('/:id', servicesController.getSingle);
router.post('/', servicesController.createService);
router.put('/:id', servicesController.updateService);
router.delete('/:id', servicesController.deleteService);

module.exports = router;