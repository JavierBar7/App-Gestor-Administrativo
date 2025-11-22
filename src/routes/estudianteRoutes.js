const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudiante.controller');

// Lista estudiantes (todos)
router.get('/', estudianteController.getEstudiantes);

// --- IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos ---
router.get('/listado/morosos', estudianteController.getListadoDeudores);

// Detalles de un estudiante (pagos, representante, grupos)
// Express lee de arriba a abajo. Si esta ruta estuviera arriba, 
// interceptaría "listado" pensando que es un ID.
router.get('/:id', estudianteController.getEstudianteDetails);

// Deudas de un estudiante
router.get('/:id/deudas', estudianteController.getDeudas);

// Actualizar estudiante
router.put('/:id', estudianteController.updateEstudiante);

// Crea estudiante
router.post('/', estudianteController.createEstudiante);

// Payment request routes
router.post('/:id/solicitudes', estudianteController.createSolicitudPago);
router.get('/:id/solicitudes', estudianteController.getSolicitudesPago);

module.exports = router;