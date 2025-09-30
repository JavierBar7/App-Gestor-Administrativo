const connection = require('../../config/database');

class Estudiante {
    constructor(idEstudiantes, Nombres, Apellidos, Cedula, Telefono, Direccion) {
        this.idEstudiantes = idEstudiantes;
        this.Nombres = Nombres;
        this.Apellidos = Apellidos;
        this.Cedula = Cedula;
        this.Telefono = Telefono;
        this.Direccion = Direccion;
    }

    async save() {
        try {
            const query = 'INSERT INTO Estudiantes (Nombres, Apellidos, Cedula, Telefono, Direccion) VALUES (?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Telefono,
                this.Direccion
            ]);
            this.idEstudiantes = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el estudiante: ${error.message}`);
        }
    }
    
    async update() {
        try {
            const query = 'UPDATE Estudiantes SET Nombres = ?, Apellidos = ?, Cedula = ?, Telefono = ?, Direccion = ? WHERE idEstudiantes = ?';
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Telefono,
                this.Direccion,
                this.idEstudiantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el estudiante: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const query = 'SELECT * FROM Estudiantes';
            const [rows] = await connection.execute(query);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los estudiantes: ${error.message}`);
        }
    }

    static async findById(idEstudiantes) {
        try {
            const query = 'SELECT * FROM Estudiantes WHERE idEstudiantes = ?';
            const [rows] = await connection.execute(query, [idEstudiantes]);
            if (rows.length > 0) {
                const row = rows[0];
                return new Estudiante(row.idEstudiantes, row.Nombres, row.Apellidos, row.Cedula, row.Telefono, row.Direccion);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el estudiante: ${error.message}`);
        }
    }

    static async deleteById(idEstudiantes) {
        try {
            const query = 'DELETE FROM Estudiantes WHERE idEstudiantes = ?';
            const [result] = await connection.execute(query, [idEstudiantes]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el estudiante: ${error.message}`);
        }
    }
}

module.exports = Estudiante;