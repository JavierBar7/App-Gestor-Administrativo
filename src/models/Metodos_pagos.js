const connection = require('../config/db');

class Metodos_Pagos {
    constructor(idMetodo_Pagos, Nombre, Tipo_Validacion, Moneda_asociada) {
        this.idMetodo_Pagos = idMetodo_Pagos;
        this.Nombre = Nombre;
        this.Tipo_Validacion = Tipo_Validacion;
        this.Moneda_asociada = Moneda_asociada;
    }

    async save() {
        try {
            // idMetodo_Pagos no es AUTO_INCREMENT, debe ser provisto.
            const query = 'INSERT INTO Metodos_Pagos (idMetodo_Pagos, Nombre, Tipo_Validacion, Moneda_asociada) VALUES (?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idMetodo_Pagos,
                this.Nombre,
                this.Tipo_Validacion,
                this.Moneda_asociada
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el método de pago: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Metodos_Pagos SET Nombre = ?, Tipo_Validacion = ?, Moneda_asociada = ? WHERE idMetodo_Pagos = ?';
            const [result] = await connection.execute(query, [
                this.Nombre,
                this.Tipo_Validacion,
                this.Moneda_asociada,
                this.idMetodo_Pagos
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el método de pago: ${error.message}`);
        }
    }


    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Metodos_Pagos');
            return rows;
        }
        catch (error) {
            throw new Error(`Error al obtener los métodos de pago: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Metodos_Pagos WHERE idMetodo_Pagos = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new MetodosPagos(r.idMetodo_Pagos, r.Nombre, r.Tipo_Validacion, r.Moneda_asociada);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener el método de pago: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const query = 'DELETE FROM Metodos_Pagos WHERE idMetodo_Pagos = ?';
            const [result] = await connection.execute(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el método de pago: ${error.message}`);
        }
    }
}

module.exports = Metodos_Pagos;