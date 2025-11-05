const { Usuario } = require('../models/Usuario');

exports.getUsers = async (req, res) => {
    try {
        const [rows] = await require('../../config/database').promise().query(
            `SELECT u.username, u.password, r.rolName AS rol, 'N/A' AS createdAt
             FROM Usuario u
             JOIN Rol r ON u.rol_id = r.id`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

exports.updateUser = async (req, res) => {
    const { username } = req.params;
    const { newPassword, newRol } = req.body;

    try {
        const success = await Usuario.update(username, newPassword, newRol);
        if (success) {
            res.json({ success: true, message: 'Usuario actualizado correctamente' });
        } else {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar usuario', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
};
