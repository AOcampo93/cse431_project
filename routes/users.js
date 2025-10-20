const router = require('express').Router();
const usersController = require('../controllers/users');
const validateObjectId = require('../middleware/validateObjectId');

/*
 * Routes for managing users
 *
 * Base route: /users
 */

router.get('/', usersController.getAll);
router.get('/:id', validateObjectId, usersController.getSingle);
router.post('/', usersController.createUser);
router.put('/:id', validateObjectId, usersController.updateUser);
router.delete('/:id', validateObjectId, usersController.deleteUser);

module.exports = router;