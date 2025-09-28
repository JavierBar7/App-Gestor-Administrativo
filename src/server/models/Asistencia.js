const connection = require('../config/database');

class Asistencia {
    constructor(Nombres, Apellidos, Cedula, Telefono, Direccion){
        this.Nombres = Nombres;
        this.Apellidos = Apellidos;
        this.Cedula = Cedula;
        this.Telefono = Telefono;
        this.Direccion = Direccion; 
    }

    async save() {
        try {
            this.validate();
            const query = `
                INSERT INTO asistencia 
                (Nombres, Apellidos, Cedula, Telefono, Direccion, presente)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Telefono,
                this.Direccion,
                this.presente
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar asistencia: ${error.message}`);
        }
    }

    async update() {
        try {
            this.validate();
            const query = `
                UPDATE asistencia 
                SET Nombres=?, Apellidos=?, Telefono=?, Direccion=?, presente=?
                WHERE Cedula=?
            `;
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Telefono,
                this.Direccion,
                this.presente,
                this.Cedula
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar asistencia: ${error.message}`);
        }
    }

    static async finconnectionyCedula(Cedula) {
        try {
            const query = 'SELECT * FROM asistencia WHERE Cedula = ?';
            const [rows] = await connection.execute(query, [Cedula]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar asistencia: ${error.message}`);
        }
    }

    static async deleteByCedula(Cedula) {
        try {
            const query = 'DELETE FROM asistencia WHERE Cedula=?';
            const [result] = await connection.execute(query, [Cedula]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar asistencia: ${error.message}`);
        }
    }
}


module.exports = Asistencia;   