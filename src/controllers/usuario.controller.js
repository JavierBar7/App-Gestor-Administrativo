const { Usuario } = require('../models/Usuario');

// Obtiene lista de usuarios (solo campos seguros para mostrar en la UI)
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await require('../../config/database').promise().query(
            `SELECT u.idUsuario AS idUsuario, u.Nombre_Usuario AS Nombre_Usuario, r.Nombre_Rol AS rol
             FROM usuarios u
             JOIN roles r ON u.idRol = r.idRol`
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
        // newRol debe ser el idRol (entero) en la tabla `roles`
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
