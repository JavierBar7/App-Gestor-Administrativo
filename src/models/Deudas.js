const connection = require('../config/db');

class Deudas {
    constructor(idDeudas,idEstudiantes, Monto_usd, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto,Estado ) {
        this.idDeudas = idDeudas;
        this.idEstudiantes = idEstudiantes;
        this.Monto_usd = Monto_usd;
        this.Monto_bs_emision = Monto_bs_emision;
        this.Fecha_emision = Fecha_emision;
        this.Fecha_vencimiento = Fecha_vencimiento;
        this.Concepto = Concepto;
        this.Estado = Estado;
    }
    async save() {
        try {
            // idDeudas no es AUTO_INCREMENT, debe ser provisto.
            const query = 'INSERT INTO Deudas (idDeudas,idEstudiantes, Monto_usd, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto,Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idDeudas,
                this.idEstudiantes,
                this.Monto_usd,
                this.Monto_bs_emision,
                this.Fecha_emision,
                this.Fecha_vencimiento,
                this.Concepto,
                this.Estado
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la deuda: ${error.message}`);
        }
    }
    async update() {
        try {
            const query = 'UPDATE Deudas SET idEstudiantes = ?, Monto_usd = ?, Monto_bs_emision = ?, Fecha_emision = ?, Fecha_vencimiento = ?, Concepto = ?, Estado = ? WHERE idDeudas = ?';
            const [result] = await connection.execute(query, [
                this.idEstudiantes,
                this.Monto_usd,
                this.Monto_bs_emision,
                this.Fecha_emision,
                this.Fecha_vencimiento,
                this.Concepto,
                this.Estado,
                this.idDeudas
            ]);
            return result;
        }
        catch (error) {
            throw new Error(`Error al actualizar la deuda: ${error.message}`);
        }
    }
    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Deudas');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las deudas: ${error.message}`);
        }
    }
    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Deudas WHERE idDeudas = ?', [id]);
            if (rows.length > 0) {
                const d = rows[0];
                return new Deuda(d.idDeudas,d.idEstudiantes, d.Monto_usd, d.Monto_bs_emision, d.Fecha_emision, d.Fecha_vencimiento, d.Concepto,d.Estado);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener la deuda: ${error.message}`);
        }
    }
    static async deleteById(id) {
        try {
            const query = 'DELETE FROM Deudas WHERE idDeudas = ?';
            const [result] = await connection.execute(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la deuda: ${error.message}`);
        }
    }
}

module.exports = Deudas;