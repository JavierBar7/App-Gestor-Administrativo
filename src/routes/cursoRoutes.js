const express = require('express');
const router = express.Router();
const { createCurso, listCursos } = require('../controllers/curso.controller');

router.post('/', createCurso);
router.get('/', listCursos);

module.exports = router;
