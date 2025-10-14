const router = require('express').Router();
const usersController = require('../controllers/users');

/*
 * Routes for managing users
 *
 * Base route: /users
 */

router.get('/', usersController.getAll);
router.get('/:id', usersController.getSingle);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;