const router = require('express').Router();
const appointmentsController = require('../controllers/appointments');
const validateObjectId = require('../middleware/validateObjectId');
const authenticate = require('../middleware/auth');

/*
 * Routes for managing appointments
 *
 * Base route: /appointments
 */

// All appointment routes require authentication. Additional
// authorization is handled inside the controller based on the user
// context (admin vs client). validateObjectId remains to guard IDs.
router.get('/', authenticate, appointmentsController.getAll);
router.get('/:id', authenticate, validateObjectId, appointmentsController.getSingle);
router.post('/', authenticate, appointmentsController.createAppointment);
router.put('/:id', authenticate, validateObjectId, appointmentsController.updateAppointment);
router.delete('/:id', authenticate, validateObjectId, appointmentsController.deleteAppointment);

module.exports = router;