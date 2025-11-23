const conn = require('../../config/database');


class Usuario {

    constructor(Nombre_Usuario, Clave) {
        this.Nombre_Usuario = Nombre_Usuario;
        this.Clave = Clave;
    }

    // Busca un usuario por Nombre_Usuario y Clave (los nombres de columnas corresponden a la tabla `usuarios`)
    static async findUserAndPassword(Nombre_Usuario, Clave) {
        try {
            const [rows] = await conn.promise().query(
                `SELECT u.idUsuario AS idUsuario, u.Nombre_Usuario, u.Clave, u.idRol, r.Nombre_Rol AS rolName
                FROM usuarios u
                JOIN roles r ON u.idRol = r.idRol
                WHERE u.Nombre_Usuario = ? AND u.Clave = ?`,
                [Nombre_Usuario, Clave]
            );
            return rows[0];
        } catch (error) {
            console.error('Error al validar datos (Usuario.findUserAndPassword)', error);
            throw error;
        }
    }



    // Actualiza la clave y el rol (usa idRol en la tabla real)
    static async update(Nombre_Usuario, newClave, newIdRol) {
        try {
            const [result] = await conn.promise().query(
                'UPDATE usuarios SET Clave = ?, idRol = ? WHERE Nombre_Usuario = ?',
                [newClave, newIdRol, Nombre_Usuario]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error actualizando usuario (Usuario.update)', error);
            throw error;
        }
    }

}

module.exports = {Usuario};


