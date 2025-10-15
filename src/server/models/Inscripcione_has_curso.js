const connection = require('../config/db');

class HistorialTasa {
    constructor(idHistorialTasa, Fecha, Monto, Descripcion, Inscripciones_idInscripciones) {
        this.idHistorialTasa = idHistorialTasa;
        this.Fecha = Fecha;
        this.Monto = Monto;
        this.Descripcion = Descripcion;
        this.Inscripciones_idInscripciones = Inscripciones_idInscripciones;
    }

    async save() {
        try {
            const query = 'INSERT INTO HistorialTasa (Fecha, Monto, Descripcion, Inscripciones_idInscripciones) VALUES (?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.Fecha,
                this.Monto,
                this.Descripcion,
                this.Inscripciones_idInscripciones
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el historial de tasa: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE HistorialTasa SET Fecha = ?, Monto = ?, Descripcion = ?, Inscripciones_idInscripciones = ? WHERE idHistorialTasa = ?';
            const [result] = await connection.execute(query, [
                this.Fecha,
                this.Monto,
                this.Descripcion,
                this.Inscripciones_idInscripciones,
                this.idHistorialTasa
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el historial de tasa: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM HistorialTasa');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los historiales de tasa: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM HistorialTasa WHERE idHistorialTasa = ?', [id]);
            if (rows.length > 0) {
                const h = rows[0];
                return new HistorialTasa(h.idHistorialTasa, h.Fecha, h.Monto, h.Descripcion, h.Inscripciones_idInscripciones);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener el historial de tasa: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM HistorialTasa WHERE idHistorialTasa = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el historial de tasa: ${error.message}`);
        }
    }
}

module.exports = HistorialTasa;