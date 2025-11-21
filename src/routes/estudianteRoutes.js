const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudiante.controller');

// Lista estudiantes (todos)
router.get('/', estudianteController.getEstudiantes);

// --- NUEVA RUTA: Listado de Deudores ---
router.get('/listado/morosos', estudianteController.getListadoDeudores);

// Detalles de un estudiante (pagos, representante, grupos)
router.get('/:id', estudianteController.getEstudianteDetails);
router.get('/:id/deudas', estudianteController.getDeudas);
router.put('/:id', estudianteController.updateEstudiante);

// Crea estudiante (y representante/inscripcion si aplica)
router.post('/', estudianteController.createEstudiante);

module.exports = router;