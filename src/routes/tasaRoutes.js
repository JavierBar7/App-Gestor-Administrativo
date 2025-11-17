const express = require('express');
const router = express.Router();
const tasaController = require('../controllers/tasa.controller');

// GET latest rate
router.get('/latest', tasaController.getLatest);

// GET historial (all saved rates)
router.get('/historial', tasaController.getHistorial);

// POST new rate
router.post('/', tasaController.create);

module.exports = router;
