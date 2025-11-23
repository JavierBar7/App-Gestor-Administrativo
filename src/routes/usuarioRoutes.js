const express = require('express');
const router = express.Router();
const userController = require('../controllers/usuario.controller');

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:username', userController.updateUser);

module.exports = router;
