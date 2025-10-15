
const connection = require('../config/db');

class CuentasDestino { 
    constructor(idCuentasDestino, nombre, tipo, moneda) {
        this.idCuentasDestino = idCuentasDestino;
        this.nombre = nombre;
        this.tipo = tipo;
        this.moneda = moneda;
    }
    async save() {
        try {
            const query = 'INSERT INTO Cuentas_destino (idCuentasDestino, nombre, tipo, moneda) VALUES (?, ?, ?, ?)';   
            const [result] = await connection.execute(query, [
                this.idCuentasDestino,
                this.nombre,
                this.tipo,
                this.moneda
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la cuenta destino: ${error.message}`);
        }   
    }
    async update() {
        try {
            const query = 'UPDATE Cuentas_destino SET nombre = ?, tipo = ?, moneda = ? WHERE idCuentasDestino = ?';
            const [result] = await connection.execute(query, [
                this.nombre,
                this.tipo,
                this.moneda,
                this.idCuentasDestino
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar la cuenta destino: ${error.message}`);
        }   
    }
    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Cuentas_destino');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las cuentas destino: ${error.message}`);
        }
    }
    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Cuentas_destino WHERE idCuentasDestino = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new CuentasDestino(r.idCuentasDestino, r.nombre, r.tipo, r.moneda);
            }
            return null;
        }
        catch (error) {
            throw new Error(`Error al obtener la cuenta destino: ${error.message}`);
        }  
    }
    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Cuentas_destino WHERE idCuentasDestino = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la cuenta destino: ${error.message}`);
        }   
    }
}

module.exports = CuentasDestino;