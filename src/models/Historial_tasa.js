const connection = require('../config/db');

class HistorialTasa {
    constructor(idHistorial_tasa, Fecha, Tasa_Anterior, Tasa_Nueva, Tasa_cambio_idTasa, Tasa_cambio_Deudas_idDeudas, Tasa_cambio_Deudas_Estudiantes_idEstudiantes) {
        this.idHistorial_tasa = idHistorial_tasa;
        this.Fecha = Fecha;
        this.Tasa_Anterior = Tasa_Anterior;
        this.Tasa_Nueva = Tasa_Nueva;
        this.Tasa_cambio_idTasa = Tasa_cambio_idTasa;
        this.Tasa_cambio_Deudas_idDeudas = Tasa_cambio_Deudas_idDeudas;
        this.Tasa_cambio_Deudas_Estudiantes_idEstudiantes = Tasa_cambio_Deudas_Estudiantes_idEstudiantes;
    }

    async save() {
        try {
            const query = `INSERT INTO Historial_tasa 
                (Fecha, Tasa_Anterior, Tasa_Nueva, Tasa_cambio_idTasa, Tasa_cambio_Deudas_idDeudas, Tasa_cambio_Deudas_Estudiantes_idEstudiantes) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Fecha,
                this.Tasa_Anterior,
                this.Tasa_Nueva,
                this.Tasa_cambio_idTasa,
                this.Tasa_cambio_Deudas_idDeudas,
                this.Tasa_cambio_Deudas_Estudiantes_idEstudiantes
            ]);
            return result;
        }
        catch (error) {
            throw new Error(`Error al guardar el historial de tasa: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = `UPDATE Historial_tasa SET 
                Fecha = ?, Tasa_Anterior = ?, Tasa_Nueva = ?, Tasa_cambio_idTasa = ?, Tasa_cambio_Deudas_idDeudas = ?, Tasa_cambio_Deudas_Estudiantes_idEstudiantes = ? 
                WHERE idHistorial_tasa = ?`;
            const [result] = await connection.execute(query, [
                this.Fecha,
                this.Tasa_Anterior,
                this.Tasa_Nueva,
                this.Tasa_cambio_idTasa,
                this.Tasa_cambio_Deudas_idDeudas,
                this.Tasa_cambio_Deudas_Estudiantes_idEstudiantes,
                this.idHistorial_tasa
            ]);
            return result;
        }
        catch (error) {
            throw new Error(`Error al actualizar el historial de tasa: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Historial_tasa');
            return rows;
        }
        catch (error) {
            throw new Error(`Error al obtener los historiales de tasa: ${error.message}`);
        }
    }
    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Historial_tasa WHERE idHistorial_tasa = ?', [id]); 
    
            if (rows.length > 0) {
                const r = rows[0];
                return new HistorialTasa(r.idHistorial_tasa, r.Fecha, r.Tasa_Anterior, r.Tasa_Nueva, r.Tasa_cambio_idTasa, r.Tasa_cambio_Deudas_idDeudas, r.Tasa_cambio_Deudas_Estudiantes_idEstudiantes);
            }
            return null;
        }
        catch (error) {
            throw new Error(`Error al buscar el historial de tasa: ${error.message}`);
        }
    }
    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Historial_tasa WHERE idHistorial_tasa = ?', [id]);
            return result;
        }
        catch (error) {
            throw new Error(`Error al eliminar el historial de tasa: ${error.message}`);
        }
    }    
}

module.exports = HistorialTasa;