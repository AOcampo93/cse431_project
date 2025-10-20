const router = require('express').Router();
const appointmentsController = require('../controllers/appointments');
const validateObjectId = require('../middleware/validateObjectId');

/*
 * Routes for managing appointments
 *
 * Base route: /appointments
 */

router.get('/', appointmentsController.getAll);
router.get('/:id', validateObjectId, appointmentsController.getSingle);
router.post('/', appointmentsController.createAppointment);
router.put('/:id', validateObjectId, appointmentsController.updateAppointment);
router.delete('/:id', validateObjectId, appointmentsController.deleteAppointment);

module.exports = router;