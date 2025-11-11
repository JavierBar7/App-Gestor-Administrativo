const express = require('express');
const router = express.Router();
const { createGrupo, listGrupos } = require('../controllers/grupo.controller');

router.post('/', createGrupo);
router.get('/', listGrupos);

module.exports = router;
