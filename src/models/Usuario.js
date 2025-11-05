const conn = require('../../config/database'); 


class Usuario {

    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    static async findUserAndPassword(username, password) {
        try {
            const [rows] = await conn.promise().query(
                'SELECT u.id, u.username, u.password, r.rolName FROM Usuario u JOIN Rol r ON u.rol_id = r.id WHERE u.username = ? AND u.password = ?',
                [username, password] 
            );
            return rows[0];
        } catch (error) {
            console.error('Error al validar datos', error);
            throw error;
        }
    }

    static async updateLastLogin(userId) {
        try {
            await conn.promise().query(
                'UPDATE Usuario SET last_login = NOW() WHERE id = ?',
                [userId]
            );
        } catch (error) {
            console.error('Error al actualizar last_login', error);
            throw error;
        }
    }

    static async update(username, newPassword, newRol) {
        try {
            const [result] = await conn.promise().query(
                'UPDATE Usuario SET password = ?, rol = ? WHERE username = ?',
                [newPassword, newRol, username]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error actualizando usuario', error);
            throw error;
        }
    }

}

module.exports = {Usuario};


