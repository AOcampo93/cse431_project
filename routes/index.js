const express = require('express');
const router = express.Router();

router.use('/', require('./swagger'));

module.exports = router;
