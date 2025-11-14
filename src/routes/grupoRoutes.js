const express = require('express');
const router = express.Router();
const { createGrupo, listGrupos, updateGrupo, summaryGrupos, estudiantesPorGrupo } = require('../controllers/grupo.controller');

router.post('/', createGrupo);
router.get('/', listGrupos);
router.get('/summary', summaryGrupos);
router.put('/:id', updateGrupo);
router.get('/:id/estudiantes', estudiantesPorGrupo);

module.exports = router;
