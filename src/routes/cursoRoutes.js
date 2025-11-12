const express = require('express');
const router = express.Router();
const { createCurso, listCursos, updateCurso } = require('../controllers/curso.controller');

router.post('/', createCurso);
router.get('/', listCursos);
router.put('/:id', updateCurso);

module.exports = router;
