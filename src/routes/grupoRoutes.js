const express = require('express');
const router = express.Router();
const { createGrupo, listGrupos, updateGrupo } = require('../controllers/grupo.controller');

router.post('/', createGrupo);
router.get('/', listGrupos);
router.put('/:id', updateGrupo);

module.exports = router;
