const express = require('express');
const router = express.Router();
const pagosApi = require('../controllers/pagosApi.controller');

// POST create payment
router.post('/', pagosApi.createPayment);

module.exports = router;
