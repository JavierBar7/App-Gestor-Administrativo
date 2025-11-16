const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');

router.get('/metodos', pagosController.getMetodos);

module.exports = router;
