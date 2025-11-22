const express = require('express');
const router = express.Router();
const pagosApi = require('../controllers/pagosApi.controller');

// POST create payment
router.post('/', pagosApi.createPayment);

// GET check reference
router.get('/check-reference', pagosApi.checkReference);

module.exports = router;
