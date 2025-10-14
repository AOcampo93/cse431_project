const router = require('express').Router();
const providersController = require('../controllers/providers');

/*
 * Routes for managing providers
 *
 * Base route: /providers
 */

router.get('/', providersController.getAll);
router.get('/:id', providersController.getSingle);
router.post('/', providersController.createProvider);
router.put('/:id', providersController.updateProvider);
router.delete('/:id', providersController.deleteProvider);

module.exports = router;