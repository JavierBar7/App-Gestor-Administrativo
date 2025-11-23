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

exports.createUser = async (req, res) => {
    const { username, password, rol } = req.body;

    if (!username || !password || !rol) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    try {
        // Map role name to ID if necessary, or expect ID from frontend
        // Assuming frontend sends ID: 1 for Admin, 2 for Gestor
        // Or mapping here:
        let idRol = 2; // Default Gestor
        if (rol === 'Admin' || rol === '1') idRol = 1;
        if (rol === 'Gestor' || rol === '2') idRol = 2;

        const query = `INSERT INTO usuarios (Nombre_Usuario, Clave, idRol) VALUES (?, ?, ?)`;
        const [result] = await require('../../config/database').promise().query(query, [username, password, idRol]);

        res.json({ success: true, message: 'Usuario creado correctamente', idUsuario: result.insertId });
    } catch (error) {
        console.error('Error al crear usuario', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
};
