const express = require('express');
const router = express.Router();
console.log('Loading reportesRoutes...');
const reportesController = require('../controllers/reportes.controller');
console.log('Controller keys:', Object.keys(reportesController));

router.get('/test', (req, res) => res.send('Reportes Route Test OK'));
router.get('/deudores/pdf', reportesController.generarReporteDeudoresPDF);
router.get('/deudores/excel', reportesController.generarReporteDeudoresExcel);

module.exports = router;
