const router = require('express').Router();
const providersController = require('../controllers/providers');
const validateObjectId = require('../middleware/validateObjectId');

/*
 * Routes for managing providers
 *
 * Base route: /providers
 */

router.get('/', providersController.getAll);
router.get('/:id', validateObjectId, providersController.getSingle);
router.post('/', providersController.createProvider);
router.put('/:id', validateObjectId, providersController.updateProvider);
router.delete('/:id', validateObjectId, providersController.deleteProvider);

module.exports = router;