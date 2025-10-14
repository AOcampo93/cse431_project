const router = require('express').Router();
const appointmentsController = require('../controllers/appointments');

/*
 * Routes for managing appointments
 *
 * Base route: /appointments
 */

router.get('/', appointmentsController.getAll);
router.get('/:id', appointmentsController.getSingle);
router.post('/', appointmentsController.createAppointment);
router.put('/:id', appointmentsController.updateAppointment);
router.delete('/:id', appointmentsController.deleteAppointment);

module.exports = router;