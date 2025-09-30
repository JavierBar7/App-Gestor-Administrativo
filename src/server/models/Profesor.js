const connection = require('../../config/database');

class Profesor {
    constructor(idProfesores, Nombres, Apellidos, Cedula, Telefono, Direccion, Especialidad, Fecha_Contratacion, Datos_Pago) {
        this.idProfesores = idProfesores;
        this.Nombres = Nombres;
        this.Apellidos = Apellidos;
        this.Cedula = Cedula;
        this.Telefono = Telefono;
        this.Direccion = Direccion;
        this.Especialidad = Especialidad;
        this.Fecha_Contratacion = Fecha_Contratacion;
        this.Datos_Pago = Datos_Pago;
    }

    async save() {
        try {
            const query = 'INSERT INTO Profesores (Nombres, Apellidos, Cedula, Telefono, Direccion, Especialidad, Fecha_Contratacion, Datos_Pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Telefono,
                this.Direccion,
                this.Especialidad,
                this.Fecha_Contratacion,
                this.Datos_Pago
            ]);
            this.idProfesores = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el profesor: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Profesores SET Nombres = ?, Apellidos = ?, Cedula = ?, Telefono = ?, Direccion = ?, Especialidad = ?, Fecha_Contratacion = ?, Datos_Pago = ? WHERE idProfesores = ?';
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Telefono,
                this.Direccion,
                this.Especialidad,
                this.Fecha_Contratacion,
                this.Datos_Pago,
                this.idProfesores
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el profesor: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Profesores');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los profesores: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Profesores WHERE idProfesores = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Profesor(r.idProfesores, r.Nombres, r.Apellidos, r.Cedula, r.Telefono, r.Direccion, r.Especialidad, r.Fecha_Contratacion, r.Datos_Pago);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el profesor: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Profesores WHERE idProfesores = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el profesor: ${error.message}`);
        }
    }
}

module.exports = Profesor;