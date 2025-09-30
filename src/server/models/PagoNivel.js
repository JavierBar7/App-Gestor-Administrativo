const connection = require('../../config/database');

class PruebaNivel {
    constructor(idPrueba, Descripcion, Pagos_Prueba_nivel_idPagos_Prueba_nivel) {
        this.idPrueba = idPrueba;
        this.Descripcion = Descripcion;
        this.Pagos_Prueba_nivel_idPagos_Prueba_nivel = Pagos_Prueba_nivel_idPagos_Prueba_nivel;
    }

    async save() {
        try {
            const query = 'INSERT INTO Prueba_nivel (Descripcion, Pagos_Prueba_nivel_idPagos_Prueba_nivel) VALUES (?, ?)';
            const [result] = await connection.execute(query, [
                this.Descripcion,
                this.Pagos_Prueba_nivel_idPagos_Prueba_nivel
            ]);
            this.idPrueba = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la prueba de nivel: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Prueba_nivel SET Descripcion = ? WHERE idPrueba = ? AND Pagos_Prueba_nivel_idPagos_Prueba_nivel = ?';
            const [result] = await connection.execute(query, [
                this.Descripcion,
                this.idPrueba,
                this.Pagos_Prueba_nivel_idPagos_Prueba_nivel
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar la prueba de nivel: ${error.message}`);
        }
    }
    
    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Prueba_nivel');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las pruebas de nivel: ${error.message}`);
        }
    }

    static async findByIds(idPrueba, idPagoPrueba) {
        try {
            const query = 'SELECT * FROM Prueba_nivel WHERE idPrueba = ? AND Pagos_Prueba_nivel_idPagos_Prueba_nivel = ?';
            const [rows] = await connection.execute(query, [idPrueba, idPagoPrueba]);
            if (rows.length > 0) {
                const r = rows[0];
                return new PruebaNivel(r.idPrueba, r.Descripcion, r.Pagos_Prueba_nivel_idPagos_Prueba_nivel);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar la prueba de nivel: ${error.message}`);
        }
    }

    static async deleteByIds(idPrueba, idPagoPrueba) {
        try {
            const query = 'DELETE FROM Prueba_nivel WHERE idPrueba = ? AND Pagos_Prueba_nivel_idPagos_Prueba_nivel = ?';
            const [result] = await connection.execute(query, [idPrueba, idPagoPrueba]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la prueba de nivel: ${error.message}`);
        }
    }
}

module.exports = PruebaNivel;